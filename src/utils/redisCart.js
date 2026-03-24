const redis = require("../config/redis");

const makeSlotKey = ({ venueId, date, court, startTime }) =>
  `cart:slot:${venueId}:${date}:${court}:${startTime}`;

const makeItemKey = (itemId) => `cart:item:${itemId}`;

const makeUserSetKey = (userId) => `cart:user:${userId}`;

const releaseSlotIfOwner = async (item) => {
  const slotKey = makeSlotKey(item);
  const currentRaw = await redis.get(slotKey);
  if (!currentRaw) return;

  let current;
  try {
    current = JSON.parse(currentRaw);
  } catch {
    return;
  }

  if (String(current.itemId) === String(item.id) && String(current.userId) === String(item.userId)) {
    await redis.del(slotKey);
  }
};

const loadRedisCartItems = async (userId, cartItemIds) => {
  const ids = cartItemIds.map((id) => String(id).trim()).filter(Boolean);
  if (!ids.length) return { ok: false, reason: "INVALID_IDS" };

  const pipeline = redis.multi();
  ids.forEach((id) => pipeline.get(makeItemKey(id)));
  const raw = await pipeline.exec();

  const items = [];
  for (let i = 0; i < ids.length; i += 1) {
    const value = raw[i];
    if (!value) return { ok: false, reason: "MISSING_OR_EXPIRED" };

    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      return { ok: false, reason: "MISSING_OR_EXPIRED" };
    }

    if (String(parsed.userId) !== String(userId)) {
      return { ok: false, reason: "MISSING_OR_EXPIRED" };
    }

    items.push(parsed);
  }

  return { ok: true, ids, items };
};

const getUserCartItems = async (userId) => {
  const userSetKey = makeUserSetKey(userId);
  const ids = await redis.sMembers(userSetKey);

  if (!ids.length) return [];

  const pipeline = redis.multi();
  ids.forEach((id) => pipeline.get(makeItemKey(id)));
  const rawItems = await pipeline.exec();

  const validItems = [];
  const staleIds = [];

  for (let i = 0; i < ids.length; i += 1) {
    const raw = rawItems[i];
    if (!raw) {
      staleIds.push(ids[i]);
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      validItems.push(parsed);
    } catch {
      staleIds.push(ids[i]);
    }
  }

  if (staleIds.length) {
    await redis.sRem(userSetKey, staleIds);
  }

  return validItems;
};

module.exports = {
  makeSlotKey,
  makeItemKey,
  makeUserSetKey,
  releaseSlotIfOwner,
  loadRedisCartItems,
  getUserCartItems,
};
