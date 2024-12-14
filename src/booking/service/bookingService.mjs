import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { Booking } from "../model/bookingModel.mjs";
import { TripDuplication } from "../../tripDuplication/model/tripDuplicationModel.mjs";
import AWS from "aws-sdk";

const eventBridge = new AWS.EventBridge({
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
    const futureTime = new Date(Date.now() + delay * 60 * 1000).toISOString();

    const ruleName = `booking-expiration-${bookingId}`;
    const eventBusName = "default";

    const ruleParams = {
      Name: ruleName,
      ScheduleExpression: `rate(1 minute)`,
      State: "ENABLED",
      Description: "Rule to trigger delayed booking expiration",
      EventBusName: eventBusName,
    };
    await eventBridge.putRule(ruleParams).promise();

    const targetParams = {
      Rule: ruleName,
      EventBusName: eventBusName,
      Targets: [
        {
          Id: `target-${bookingId}`,
          Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN,
          Input: JSON.stringify({
            internalEventType:
              "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
            bookingId: bookingId,
            tripId: tripId,
            seatNumber: seatNumber,
          }),
        },
      ],
    };
    await eventBridge.putTargets(targetParams).promise();

    console.log(`Scheduled rule ${ruleName} created successfully`);
  } catch (error) {
    console.error(`Error creating delayed event: ${error.message}`);
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
