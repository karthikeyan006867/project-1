# Cloudinary Integration Guide

## What is Cloudinary?

Cloudinary is a cloud-based media management platform that allows you to upload, store, and manage images and files for your events.

## Setup Instructions

### 1. Create a Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

1. After logging in, go to the Dashboard
2. You'll see your account details:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Your API access key
   - **API Secret**: Your secret key (click "API Keys" to reveal)

### 3. Update Your .env File

Add these to your `server/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. Update Server to Use Cloudinary

The server already has Cloudinary configured! Update the `/api/upload` endpoint in `server.js`:

Replace:
```javascript
app.post('/api/upload', async (req, res) => {
  try {
    res.status(501).json({ message: 'Cloudinary integration pending - awaiting credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

With:
```javascript
const { uploadMiddleware, handleUpload } = require('./config/cloudinary');

app.post('/api/upload', uploadMiddleware, handleUpload);
```

### 5. Add File Upload to Events

You can now upload files when creating/editing events!

#### Frontend Update (client/index.html)

Add to the event form:
```html
<div class="form-group">
    <label for="eventFile">Attach File</label>
    <input type="file" id="eventFile" accept="image/*,.pdf,.doc,.docx">
</div>
```

#### Frontend Update (client/app.js)

Update the form submission to handle file uploads:
```javascript
async function handleSubmitEvent(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('eventFile');
    
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
        
        // Upload file first
        const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadResponse.json();
        eventData.attachments = [{
            url: uploadData.url,
            publicId: uploadData.publicId,
            type: uploadData.format
        }];
    }
    
    // ... rest of the code
}
```

## Features

Once configured, you can:

- ✅ Upload images for event posters
- ✅ Attach PDF documents
- ✅ Store event-related files
- ✅ Automatic image optimization
- ✅ Secure file storage

## Free Tier Limits

Cloudinary free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations/month

This is more than enough for most event management needs!

## Testing

1. Create an event
2. Attach an image or PDF
3. Check your Cloudinary dashboard to see the uploaded file
4. The file URL will be saved with your event

## Security Notes

- Never commit your `.env` file to Git
- Keep your API Secret secure
- Use signed uploads for production
- Consider implementing user authentication before allowing uploads

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Upload API](https://cloudinary.com/documentation/upload_images)

---

**Note**: Cloudinary integration is optional. The app works perfectly without it for event management and time tracking. Add it when you're ready to upload files!
