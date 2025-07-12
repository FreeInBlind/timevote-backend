const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://timevote:Timevote123@timevote.br6hv4v.mongodb.net/timevote?retryWrites=true&w=majority&appName=timevote')
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ 模型新增 maxVotesPerUser
const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  slots: [String],
  maxVotesPerUser: {
    type: Number,
    default: 3
  },
  votes: {
    type: Map,
    of: Number,
    default: {}
  },
  voters: [
    {
      username: String,
      selectedSlots: [String],
      timestamp: { type: Date, default: Date.now }
    }
  ]
});
const Event = mongoose.model('Event', EventSchema);

// ✅ 创建事件接口
app.post('/api/event', async (req, res) => {
  try {
    const { title, description, slots, maxVotesPerUser } = req.body;
    if (!title || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const votes = {};
    slots.forEach(slot => votes[slot] = 0);

    const newEvent = new Event({ title, description, slots, votes, maxVotesPerUser });
    await newEvent.save();
    res.json(newEvent);
  } catch (err) {
    console.error('❌ 创建事件失败:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ 获取事件
app.get('/api/event/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching event' });
  }
});

// ✅ 投票接口（不限制票数，由前端控制）
app.post('/api/vote/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const selectedSlots = req.body.selectedSlots || [];
    const username = req.body.username || 'Anonymous';

    selectedSlots.forEach(slot => {
      const current = event.votes.get(slot) || 0;
      event.votes.set(slot, current + 1);
    });

    event.voters.push({ username, selectedSlots });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Voting failed' });
  }
});

// ✅ 获取所有事件列表（供 history.html 使用）
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({}, 'title description _id').sort({ _id: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load events' });
  }
});

app.listen(3000, () => console.log('🚀 Server running at http://localhost:3000'));