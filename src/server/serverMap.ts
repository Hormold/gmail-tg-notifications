import mongoose, { Schema, Document } from "mongoose";

// Define the interface for our document
interface IKeyValue extends Document {
  key: string;
  value: any;
}

// Define the schema
const KeyValueSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
});

// Create the model
const KeyValue = mongoose.model<IKeyValue>("KeyValue", KeyValueSchema);

export async function setValue<TVal>(key: string, value: TVal): Promise<void> {
  await KeyValue.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
}

export async function getValue<TVal>(key: string): Promise<TVal | null> {
  const doc = await KeyValue.findOne({ key });
  return doc ? (doc.value as TVal) : null;
}

export async function isValueSet(key: string): Promise<boolean> {
  const doc = await KeyValue.findOne({ key });
  return doc !== null;
}
