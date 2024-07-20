import mongoose, { Schema, Document } from "mongoose";

// Define the interface for our document
interface IKeyValue extends Document {
  key: string;
  value: any;
  ttl?: Date;
}

// Define the schema
const KeyValueSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  ttl: { type: Date, default: null },
});

// Create the model
export const KeyValue = mongoose.model<IKeyValue>("KeyValue", KeyValueSchema);
