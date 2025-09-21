# Photobooth Booking — Firebase Firestore (Realtime)
โค้ดชุดนี้แทนระบบ Google Sheets ด้วย Firebase Firestore และซิงค์แบบ realtime ด้วย `onSnapshot`

## โครงสร้างไฟล์
- index.html — UI + ปฏิทิน + โมดัล
- firebase.js — ใส่ config ของคุณ
- api.js — CRUD + realtime watch (onSnapshot)
- calendar.js — สร้างปฏิทินแบบรายเดือน
- app.js — ลอจิกหลัก

## วิธีเริ่ม
1) เปิด Firebase Console → Project settings → ใส่ค่าจาก SDK snippet ลงใน `firebase.js`
2) Firestore → สร้าง 2 collections: `events`, `models`
   - `models` ใช้ฟิลด์: `name`, `size`, `colorBG`, `colorText`
   - `events` ใช้ฟิลด์: `eventName`, `location`, `mapLink`, `model`, `startDate`, `endDate`, `staff`, `installDate`, `installTime`, `openTime`, `closeTime`, `price`, `transportFee`, `note`, `paidDeposit`, `paidFull`
   - วันที่เก็บเป็นสตริงรูปแบบ `YYYY-MM-DD`
3) โฮสต์ไฟล์ทั้งหมดบน GitHub Pages / Vercel ได้ทันที (ไม่มี CORS)
4) เมื่อเพิ่ม/แก้/ลบ ใน Firestore หน้าเว็บจะอัปเดตอัตโนมัติ

## หมายเหตุด้านความปลอดภัย
- ตอนเริ่มต้นควรใช้ Firestore Rules: test mode ได้ แต่โปรดปรับเป็นให้เขียนได้เฉพาะผู้ที่ล็อกอินภายหลัง
