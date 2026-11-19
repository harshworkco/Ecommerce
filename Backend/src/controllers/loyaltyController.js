const { getSql } = require("../config/db");

const getLoyaltyProfile = async (req, res) => {
  res.json({
    user_id: req.user.id,
    loyalty_points: req.user.loyalty_points,
    tier: getTier(req.user.loyalty_points),
  });
};

const getLoyaltyTransactions = async (req, res) => {
  const sql = getSql();
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const result = await sql`
      SELECT * FROM loyalty_transactions
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    res.json({ transactions: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAvailableRewards = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT * FROM loyalty_rewards
      WHERE is_active = TRUE
      ORDER BY points_required ASC
    `;
    res.json({ rewards: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const redeemReward = async (req, res) => {
  const sql = getSql();
  const { reward_id } = req.body;

  try {
    const rewardResult = await sql`
      SELECT * FROM loyalty_rewards
      WHERE id = ${reward_id} AND is_active = TRUE
    `;
    if (rewardResult.length === 0) {
      return res.status(404).json({ message: "Reward not found or inactive" });
    }

    const reward = rewardResult[0];
    if (req.user.loyalty_points < reward.points_required) {
      return res.status(400).json({ message: "Insufficient loyalty points" });
    }

    await sql.begin(async (sql) => {
      await sql`
        UPDATE users
        SET loyalty_points = loyalty_points - ${reward.points_required}
        WHERE id = ${req.user.id}
      `;

      await sql`
        INSERT INTO loyalty_transactions (user_id, type, points, description)
        VALUES (${req.user.id}, ${"redeem"}, ${-reward.points_required}, ${`Redeemed reward: ${reward.name}`})
      `;
    });

    res.json({
      message: "Reward redeemed successfully",
      reward,
      remaining_points: req.user.loyalty_points - reward.points_required,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

function getTier(points) {
  if (points >= 3000) return "Platinum";
  if (points >= 1500) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

module.exports = {
  getLoyaltyProfile,
  getLoyaltyTransactions,
  getAvailableRewards,
  redeemReward,
};
