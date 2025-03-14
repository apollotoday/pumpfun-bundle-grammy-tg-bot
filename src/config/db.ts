import mongoose, { Schema } from "mongoose";
import { envParams } from "./env";

const connectMongoDB = async () => {
  let isConnected = false;

  const connect = async () => {
    try {
      if (envParams().DB_URL) {
        await mongoose.connect(envParams().DB_URL);
        isConnected = true;
      } else {
        console.log("No Mongo URL");
      }
    } catch (error) {
      console.log(`Error : ${(error as Error).message}`);
      isConnected = false;
      setTimeout(connect, 1000);
    }
  };

  connect();

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    setTimeout(connect, 1000);
  });

  mongoose.connection.on("reconnected", () => {
    isConnected = true;
  });
};

const dataSchema = new Schema({
  indexer: { type: String },
  data: { type: String },
});

const dataModel = mongoose.model("data", dataSchema);

export {
  connectMongoDB,
  dataModel
}