import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { Booking } from "../model/bookingModel.mjs";
import { TripDuplication } from "../../tripDuplication/model/tripDuplicationModel.mjs";
import AWS from "aws-sdk";
import {
  SchedulerClient,
  CreateScheduleCommand,
} from "@aws-sdk/client-scheduler";

const eventBridge = new AWS.EventBridge({
  region: process.env.FINAL_AWS_REGION,
});

const schedulerClient = new SchedulerClient({
  region: process.env.FINAL_AWS_REGION,
});

export const createNewBooking = async (booking) => {
  try {
    const foundTripDuplication = await TripDuplication.findOne({
      tripId: booking.trip,
    });
    if (
      booking.seatNumber < 1 ||
      booking.seatNumber > foundTripDuplication.capacity
    )
      return "SEAT_NOT_IN_THE_VALID_RANGE";

    const foundCommuter = await Commuter.findOne({
      commuterId: booking.commuter,
    });
    const foundBookingForThisSeat = await Booking.findOne({
      seatNumber: booking.seatNumber,
      "trip.tripId": booking.trip,
      bookingStatus: { $in: ["CREATING", "PENDING", "PAID"] },
    });
    if (foundBookingForThisSeat) return "SEAT_IS_ALREADY_USED";

    const bookingWaiting = process.env.BOOKING_WAITING || 10;

    booking.trip = {
      tripId: booking.trip,
    };
    booking.commuter = foundCommuter._id;
    booking.ticketStatus = "NOT_USED";
    booking.bookingStatus = "CREATING";
    booking.expiryAt = new Date(Date.now() + bookingWaiting * 60 * 1000);

    const newBooking = new Booking(booking);
    const savedBooking = await newBooking.save();
    console.log(`booking saved successfully :)`);

    await triggerBookingCreatedEvent(booking);
    await triggerEventForBookingExpiration(
      bookingWaiting,
      booking.bookingId,
      booking.trip.tripId,
      booking.seatNumber
    );

    //need to send otp for commuter verification

    const populatedBooking = await Booking.findById(savedBooking._id)
      .select(
        "bookingId trip.tripId commuter createdAt updatedAt seatNumber bookingStatus bookingStatus -_id"
      )
      .populate({
        path: "commuter",
        select: "commuterId name nic contact -_id",
      });
    return populatedBooking;
  } catch (error) {
    console.log(`booking creation error ${error}`);
    return null;
  }
};

const triggerEventForBookingExpiration = async (
  delay,
  bookingId,
  tripId,
  seatNumber
) => {
  try {
    const currentTime = new Date();
    const futureTime = new Date(currentTime.getTime() + delay * 60000);
    const formattedTime = futureTime
      .toISOString()
      .replace(".000", "")
      .slice(0, 19);

    const inputPayload = {
      detail: {
        internalEventType: "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
        bookingId: bookingId,
        tripId: tripId,
        seatNumber: seatNumber,
      },
    };

    const scheduleName = `booking-expiration-${bookingId}`;

    const params = {
      Name: scheduleName,
      ScheduleExpression: `at(${formattedTime})`,
      FlexibleTimeWindow: {
        Mode: "OFF",
      },
      Target: {
        Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN,
        RoleArn: process.env.SCHEDULER_ROLE_ARN,
        Input: JSON.stringify(inputPayload),
      },
      ScheduleExpressionTimezone: process.env.TIME_ZONE,
      Description: `Trigger for booking expiration - ${bookingId}`,
    };

    const command = new CreateScheduleCommand(params);
    const response = await schedulerClient.send(command);

    console.log(`Schedule created successfully :)`);
  } catch (error) {
    console.error(`Error creating schedule: ${error.message}`);
  }
};

const triggerBookingCreatedEvent = async (booking) => {
  try {
    const eventParams = {
      Entries: [
        {
          Source: "booking-service",
          DetailType: "TRIP_SUPPORT_SERVICE",
          Detail: JSON.stringify({
            internalEventType: "EVN_BOOKING_CREATED",
            bookingId: booking.bookingId,
            tripId: booking.trip.tripId,
            seatNumber: booking.seatNumber,
          }),
          EventBusName: "busriya.com_event_bus",
        },
      ],
    };
    await eventBridge.putEvents(eventParams).promise();
  } catch (error) {
    console.log(`trip creation event triggering error ${error}`);
  }
};
