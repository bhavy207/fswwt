const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Create a new document
router.post('/', auth, async (req, res) => {
  try {
    const document = new Document({
      ...req.body,
      owner: req.user._id
    });
    await document.save();
    req.user.documents.push(document._id);
    await req.user.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all documents for the current user
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific document
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a document
router.patch('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    Object.assign(document, req.body);
    document.version += 1;
    document.lastModified = new Date();
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    req.user.documents = req.user.documents.filter(
      docId => docId.toString() !== req.params.id
    );
    await req.user.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add collaborator
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { collaboratorId } = req.body;
    if (!document.collaborators.includes(collaboratorId)) {
      document.collaborators.push(collaboratorId);
      await document.save();
    }

    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 