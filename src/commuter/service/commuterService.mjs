import { Commuter } from "../model/commuterModel.mjs";

export const createNewCommuter = async (commuter) => {
  const newCommuter = new Commuter(commuter);
  const savedCommuter = await newCommuter.save();
  const returnCommuter = filterCommuterFields(savedCommuter);
  return returnCommuter;
};

export const getAllCommuters = async () => {
  const foundCommuters = await Commuter.find().select(
    "commuterId createdAt updatedAt name nic contact -_id"
  );
  return foundCommuters;
};

export const getCommuterById = async (id) => {
  const foundCommuter = await Commuter.findOne({ commuterId: id }).select(
    "commuterId createdAt updatedAt name nic contact -_id"
  );
  return foundCommuter;
};

const filterCommuterFields = (commuter) => ({
  commuterId: commuter.commuterId,
  createdAt: commuter.createdAt,
  updatedAt: commuter.updatedAt,
  name: commuter.name,
  nic: commuter.nic,
  contact: commuter.contact,
});
