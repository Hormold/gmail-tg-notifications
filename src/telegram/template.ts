import { TemplateData } from "@service/types";
import { escapeHTML } from "@service/utils";
import dayjs from "dayjs";

export const emailTemplate = (data: TemplateData): string =>
  `${data.importanceEmoji} ✉️ <b>${escapeHTML(data.from)}</b> for <b>${
    data.emailTo
  }</b> (<i>${data.importance}/5, ${data.importanceText}</i>)
<b>${escapeHTML(data.title)}</b>
<b>Category:</b> ${escapeHTML(data.category)}
${
  data.deadline
    ? `<b>Deadline/Time of Event:</b> ${dayjs(data.deadline).format(
        "HH:mm, DD/MM/YYYY"
      )}`
    : ""
}
${escapeHTML(data.summary)}
${
  data.actionSteps.length
    ? `\n<b>Recommended Actions:</b>\n${data.actionSteps
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n")}`
    : ""
}
`.trim();

export const getImportanceInfo = (
  importance: number
): { emoji: string; text: string } => {
  switch (importance) {
    case 1:
      return { emoji: "⚪️", text: "Low importance" };
    case 2:
      return { emoji: "🔵", text: "Moderate importance" };
    case 3:
      return { emoji: "🟢", text: "Important" };
    case 4:
      return { emoji: "🟠", text: "Very important" };
    case 5:
      return { emoji: "🔴", text: "Urgent" };
    default:
      return { emoji: "", text: "" };
  }
};
