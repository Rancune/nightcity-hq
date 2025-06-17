export default function handler(req, res) {
  res.status(200).json({
    missions: 3,
    runners: 7,
    cost: 5800,
    potentialGain: 14200,
  });
}
