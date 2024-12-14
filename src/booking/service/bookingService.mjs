import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { Booking } from "../model/bookingModel.mjs";
import { TripDuplication } from "../../tripDuplication/model/tripDuplicationModel.mjs";
import AWS from "aws-sdk";
import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";

const eventBridge = new AWS.EventBridge({
  region: process.env.FINAL_AWS_REGION,
});

const schedulerClient = new SchedulerClient({ region: process.env.FINAL_AWS_REGION });


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

// const triggerEventForBookingExpiration = async (
//   delay,
//   bookingId,
//   tripId,
//   seatNumber
// ) => {
//   try {
//     const futureTime = new Date(Date.now() + delay * 60 * 1000).toISOString();

//     const ruleName = `booking-expiration-${bookingId}`;
//     const eventBusName = "default";

//     const ruleParams = {
//       Name: ruleName,
//       ScheduleExpression: `rate(1 minute)`,
//       State: "ENABLED",
//       Description: "Rule to trigger delayed booking expiration",
//       EventBusName: eventBusName,
//     };
//     await eventBridge.putRule(ruleParams).promise();

//     const targetParams = {
//       Rule: ruleName,
//       EventBusName: eventBusName,
//       Targets: [
//         {
//           Id: `target-${bookingId}`,
//           Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN,
//           Input: JSON.stringify({
//             internalEventType:
//               "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
//             bookingId: bookingId,
//             tripId: tripId,
//             seatNumber: seatNumber,
//           }),
//         },
//       ],
//     };
//     await eventBridge.putTargets(targetParams).promise();

//     console.log(`Scheduled rule ${ruleName} created successfully`);
//   } catch (error) {
//     console.error(`Error creating delayed event: ${error.message}`);
//   }
// };

// const triggerEventForBookingExpiration = async (delay, bookingId, tripId, seatNumber) => {
//   try {
//     const futureTime = new Date(Date.now() + delay * 60 * 1000); // Future expiration time based on delay

//     // Define the name for the scheduled event
//     const scheduledEventName = `booking-expiration-${bookingId}`;

//     // Create the input for the scheduled event
//     const input = JSON.stringify({
//       internalEventType: "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
//       bookingId: bookingId,
//       tripId: tripId,
//       seatNumber: seatNumber,
//     });

//     // Set up the scheduled event params
//     const params = {
//       Name: scheduledEventName,
//       ScheduleExpression: `at ${futureTime.toISOString()}`,
//       State: 'ENABLED',
//       Description: 'Rule to trigger booking expiration',
//       EventBusName: 'default', // Or your custom event bus name
//       Targets: [
//         {
//           Id: `target-${bookingId}`,
//           Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN,
//           Input: input,
//         },
//       ],
//     };

//     // Put scheduled event using EventBridge v2
//     await eventBridge.putRule(params).promise();

//     console.log(`Scheduled event ${scheduledEventName} successfully for booking expiration.`);
//   } catch (error) {
//     console.error(`Error creating delayed event using EventBridge: ${error.message}`);
//   }
// };

const triggerEventForBookingExpiration = async (delay, bookingId, tripId, seatNumber) => {
  try {
    const futureTime = new Date(Date.now() + delay * 60 * 1000).toISOString(); // Delay in minutes

    // Scheduler input for Lambda
    const inputPayload = {
      internalEventType: "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
      bookingId: bookingId,
      tripId: tripId,
      seatNumber: seatNumber,
    };

    const scheduleName = `booking-expiration-${bookingId}`; // Unique name for the schedule

    const params = {
      Name: scheduleName,
      ScheduleExpression: `at(${futureTime})`, // Run at a specific time
      FlexibleTimeWindow: {
        Mode: "OFF", // Ensures the event triggers exactly at the specified time
      },
      Target: {
        Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN, // ARN of your Lambda function
        RoleArn: process.env.SCHEDULER_ROLE_ARN, // IAM role ARN to invoke the Lambda
        Input: JSON.stringify(inputPayload),
      },
      Description: `Trigger for booking expiration - ${bookingId}`,
    };

    // Create the schedule
    const command = new CreateScheduleCommand(params);
    const response = await schedulerClient.send(command);

    console.log(`Schedule created successfully: ${JSON.stringify(response)}`);
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
