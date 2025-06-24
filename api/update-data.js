const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const filePath = path.join(process.cwd(), 'data.json');
  const newData = req.body;

  fs.writeFile(filePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error('فشل في حفظ البيانات:', err);
      return res.status(500).json({ message: 'فشل في الحفظ' });
    }
    res.status(200).json({ message: 'تم الحفظ بنجاح' });
  });
}
