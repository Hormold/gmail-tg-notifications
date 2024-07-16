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
const KeyValue = mongoose.model<IKeyValue>("KeyValue", KeyValueSchema);

export async function setValue<TVal>(key: string, value: TVal, ttl?: Date) {
  await KeyValue.findOneAndUpdate(
    { key },
    { value, ttl },
    { upsert: true, new: true }
  );
}

export async function getValue<TVal>(key: string): Promise<TVal | null> {
  const doc = await KeyValue.findOne({ key });
  if (doc && doc.ttl && doc.ttl < new Date()) {
    await KeyValue.deleteOne({
      key,
    });
    return null;
  }
  return doc ? (doc.value as TVal) : null;
}

export async function isValueSet(key: string): Promise<boolean> {
  const doc = await KeyValue.findOne({ key });
  return doc !== null;
}
