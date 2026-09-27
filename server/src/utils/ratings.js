const Review = require("../models/Review");

async function setTargetRating(targetType, targetId, Model) {
  const [agg] = await Review.aggregate([
    { $match: { targetType, targetId } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const avgRating = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const reviewCount = agg ? agg.count : 0;
  await Model.findByIdAndUpdate(targetId, { avgRating, reviewCount });
}

module.exports = { setTargetRating };
