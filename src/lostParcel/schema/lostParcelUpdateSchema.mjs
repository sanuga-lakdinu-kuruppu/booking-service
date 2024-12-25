export const lostParcelUpdateSchema = {
  status: {
    notEmpty: {
      errorMessage: "status is required",
    },
    isString: {
      errorMessage: "status should be a String",
    },
    isIn: {
      options: [["FOUND", "NOT_FOUND", "HANDED_OVER"]],
      errorMessage:
        "status must be in this values : FOUND, NOT_FOUND, HANDED_OVER",
    },
  },
  takeAwayStation: {
    isString: {
      errorMessage: "takeAwayStation should be a String",
    },
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "takeAwayStation must be less than 100 characters",
    },
  },
  handedOverPersonFirstName: {
    optional: true,
    isString: {
      errorMessage: "handedOverPersonFirstName should be a String",
    },
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "handedOverPersonFirstName must be less than 50 characters",
    },
  },
  handedOverPersonLastName: {
    optional: true,
    isString: {
      errorMessage: "handedOverPersonLastName should be a String",
    },
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "handedOverPersonLastName must be less than 50 characters",
    },
  },
  handedOverPersonNIC: {
    optional: true,
    isString: {
      errorMessage: "handedOverPersonNIC should be a String",
    },
    matches: {
      options: [/^(?:\d{9}[vVxX]|\d{12})$/],
      errorMessage:
        "handedOverPersonNIC must be a valid Sri Lankan NIC in the format '123456789V' or '200012345678'",
    },
  },
};
