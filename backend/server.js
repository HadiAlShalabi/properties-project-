import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY)

const app = express();
app.use(cors());
app.use(express.json());

// باقي الكود كما هو...


// ✅ نقطة اختبار
app.get('/', (req, res) => {
  res.send('🚀 السيرفر يعمل باستخدام Supabase');
});

// ✅ جلب العقارات مع الصور
app.get('/properties', async (req, res) => {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, property_images(image_url)');

    if (error) throw error;

    const formatted = properties.map(prop => ({
      ...prop,
      images: prop.property_images.map(img => img.image_url)
    }));

    res.json(formatted);
  } catch (err) {
    console.error('خطأ في جلب العقارات:', err);
    res.status(500).json({ error: 'فشل في جلب العقارات' });
  }
});

// ✅ إضافة عقار جديد

app.post('/properties', async (req, res) => {
  const {
    title, type, size, price, streets,
    location_link ,
    description, phone, whatsapp, images,
    license_type, license_number, registry_number,status, Advertiser_Number
  } = req.body;

  console.log(req.body);

  try {
    const { data: property, error: insertError } = await supabase
      .from('properties')
      .insert([{
        title, type, size, price, streets,
        location_link, description, phone,
        whatsapp, license_type, license_number, registry_number,status, Advertiser_Number
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    if (Array.isArray(images) && images.length > 0) {
      const imageRows = images.map(url => ({
        property_id: property.id,
        image_url: url
      }));

      const { error: imageError } = await supabase
        .from('property_images')
        .insert(imageRows);

      if (imageError) throw imageError;
    }

    res.status(201).json({ message: '✅ تم إضافة العقار الجديد بنجاح', id: property.id });
  } catch (err) {
    console.error('خطأ في الإضافة:', err);
    res.status(500).json({ error: 'فشل في إضافة العقار' });
  }
});

// ✅ حذف عقار
app.delete('/properties/:id', async (req, res) => {
  const propertyId = req.params.id;

  try {
    const { error: imgError } = await supabase
      .from('property_images')
      .delete()
      .eq('property_id', propertyId);

    if (imgError) throw imgError;

    const { error: propError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (propError) throw propError;

    res.json({ message: '✅ تم حذف العقار بنجاح' });
  } catch (err) {
    console.error('خطأ في الحذف:', err);
    res.status(500).json({ error: 'فشل في حذف العقار' });
  }
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 السيرفر يعمل على http://localhost:${PORT}`);
});

