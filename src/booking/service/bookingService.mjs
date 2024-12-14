import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { Booking } from "../model/bookingModel.mjs";
import { TripDuplication } from "../../tripDuplication/model/tripDuplicationModel.mjs";
import AWS from "aws-sdk";

const eventBridge = new AWS.EventBridge({
  region: process.env.FINAL_AWS_REGION,
});

const eventBridgeScheduler = new AWS.EventBridgeScheduler({
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
    const futureTime = new Date(Date.now() + delay * 60 * 1000); // Future expiration time based on delay

    // Define the name for the scheduled event
    const scheduledEventName = `booking-expiration-${bookingId}`;

    // Create the input for the scheduled event
    const input = JSON.stringify({
      internalEventType: "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
      bookingId: bookingId,
      tripId: tripId,
      seatNumber: seatNumber,
    });

    // Set up the scheduled event
    
    const params = {
      Name: scheduledEventName,
      Schedule: {
        // Set a time when the event should be triggered
        // Use the future time (calculated based on `delay`)
        // Example: cron expression or specific timestamp (ISO 8601 format)
        FlexibleTimeWindow: {
          StartTime: futureTime.toISOString(), // Future time when the event should trigger
          EndTime: futureTime.toISOString(), // End time (same as start for immediate trigger)
        },
      },
      Target: {
        Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN, // The target ARN for the event
        Input: input,
      },
    };

    // Schedule the event
    await eventBridgeScheduler.putScheduledEvent(params).promise();

    console.log(`Scheduled event ${scheduledEventName} successfully for booking expiration.`);
  } catch (error) {
    console.error(`Error creating delayed event using EventBridge Scheduler: ${error.message}`);
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
