import { Commuter } from "../model/commuterModel.mjs";

export const createNewCommuter = async (commuter) => {
  try {
    const newCommuter = new Commuter(commuter);
    const savedCommuter = await newCommuter.save();
    console.log(`commuter saved successfully :)`);
    const returnCommuter = filterCommuterFields(savedCommuter);
    return returnCommuter;
  } catch (error) {
    console.log(`commuter creation error ${error}`);
  }
};

export const getAllCommuters = async () => {
  try {
    const foundCommuters = await Commuter.find().select(
      "commuterId createdAt updatedAt name nic contact -_id"
    );
    console.log(`commuter fetched successfully`);
    return foundCommuters;
  } catch (error) {
    console.log(`commuter getting error ${error}`);
  }
};

export const getCommuterById = async (id) => {
  try {
    const foundCommuter = await Commuter.findOne({ commuterId: id }).select(
      "commuterId createdAt updatedAt name nic contact -_id"
    );
    console.log(`commuter fetched successfully`);
    return foundCommuter;
  } catch (error) {
    console.log(`commuter getting error ${error}`);
  }
};

const filterCommuterFields = (commuter) => ({
  commuterId: commuter.commuterId,
  createdAt: commuter.createdAt,
  updatedAt: commuter.updatedAt,
  name: commuter.name,
  nic: commuter.nic,
  contact: commuter.contact,
});
