function positiveId(v) {
  return (
    /^\d+$/.test(String(v)) && Number.isSafeInteger(Number(v)) && Number(v) > 0
  );
}
function date(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v
  );
}
function text(v, max) {
  return typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
}
function registration(b) {
  if (!text(b.full_name, 100))
    return "Name is required (maximum 100 characters).";
  if (!text(b.email, 100) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim()))
    return "Enter a valid email address.";
  if (!text(b.phone, 20) || !/^[+()\d\s-]{6,20}$/.test(b.phone.trim()))
    return "Enter a valid contact phone number.";
  if (
    !Number.isInteger(b.ticket_quantity) ||
    b.ticket_quantity < 1 ||
    b.ticket_quantity > 100
  )
    return "Tickets must be a whole number from 1 to 100.";
  return null;
}
function event(b) {
  if (!positiveId(b.organisation_id) || !positiveId(b.category_id))
    return "Select a valid organisation and category.";
  for (const [key, max] of [
    ["event_name", 100],
    ["location", 150],
    ["purpose", 255],
  ])
    if (!text(b[key], max))
      return key + " is required and must fit its maximum length.";
  if (!date(b.event_date)) return "Enter a valid event date (YYYY-MM-DD).";
  if (
    typeof b.event_time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(b.event_time)
  )
    return "Enter a valid event time (HH:MM).";
  if (
    b.description != null &&
    (typeof b.description !== "string" || b.description.length > 500)
  )
    return "Description maximum length is 500.";
  for (const key of [
    "ticket_price",
    "fundraising_goal",
    "fundraising_progress",
  ])
    if (
      typeof b[key] !== "number" ||
      !Number.isFinite(b[key]) ||
      b[key] < 0 ||
      b[key] > 99999999.99 ||
      Math.abs(b[key] * 100 - Math.round(b[key] * 100)) > 0.00001
    )
      return (
        key + " must be a non-negative amount with at most two decimal places."
      );
  if (!["Active", "Past", "Suspended"].includes(b.status))
    return "Status must be Active, Past or Suspended.";
  return null;
}
module.exports = { positiveId, date, text, registration, event };
