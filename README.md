# แฟ้มสะสมผลงาน (Portfolio) - นางสาวอโรชา บุญเหลือ (บุ๋มบิ๋ม)
**สาขาครุศาสตร์อุตสาหกรรมไฟฟ้า คณะครุศาสตร์อุตสาหกรรม**  
**มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farochaboonlue2047-cmd%2Fportfolio)

---

## 🌐 ลิงก์ออนไลน์และการเผยแพร่ (Live Deployments)
* **GitHub Repository:** [https://github.com/arochaboonlue2047-cmd/portfolio](https://github.com/arochaboonlue2047-cmd/portfolio)
* **GitHub Pages (Live Website):** [https://arochaboonlue2047-cmd.github.io/portfolio/](https://arochaboonlue2047-cmd.github.io/portfolio/)
* **Vercel Deploy (1-Click):** [กดที่นี่เพื่อ Deploy ขึ้น Vercel ทันที](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farochaboonlue2047-cmd%2Fportfolio)

---

## 🌸 ข้อมูลภาพรวมเว็บไซต์
เว็บไซต์ Portfolio นี้ได้รับการออกแบบและพัฒนาขึ้นในรูปแบบ **Modern Cute & Professional** (สดใสน่ารัก สบายตา แต่อัดแน่นด้วยความเรียบร้อย ทางการ และน่าเชื่อถือ) โดยอิงตามแนวคิดการออกแบบชั้นยอด (Impeccable Design Principles) เพื่อการนำเสนอแฟ้มสะสมผลงานแก่อาจารย์ คณะกรรมการ และผู้ประเมิน

---

## 📂 โครงสร้างการนำทาง (Multi-Section Tabbed)
1. **หน้าหลัก (Home):** แบนเนอร์ภาพถ่ายพร้อมเอฟเฟกต์หมุนประกาย, ป้ายสถานะนักศึกษา, สรุปเกรดเฉลี่ย ปวส. (3.85) / ปวช. (3.80), ไฮไลต์ชิ้นงาน และปุ่มพิมพ์เอกสาร Portfolio
2. **ข้อมูลส่วนตัว (Personal Info):** ข้อมูลส่วนตัวครบถ้วน (รหัสนักศึกษา, วันเกิด, สัญชาติ, เบอร์โทร, อีเมล, มหาวิทยาลัย, คณะ, สาขา) พร้อมการแสดงทักษะความเชี่ยวชาญด้านวิศวกรรมไฟฟ้าและวิชาชีพครูด้วยแถบ Progress Bar
3. **ประวัติการศึกษา (Education):** เส้นทางไทม์ไลน์การศึกษาตั้งแต่ระดับประถมศึกษาจนถึงระดับปริญญาตรี พร้อมป้ายเกียรตินิยมและเกรดเฉลี่ย
4. **รายวิชา (Courses):** รวมรายวิชาหลัก เช่น ดิจิทัลลอจิก, AutoCAD เขียนแบบไฟฟ้า, การสอนครุศาสตร์ และรายงานชิ้นงานจำลอง Proteus / แบบงาน CAD
5. **กิจกรรมและผลงาน (Activities):** รวมผลงานเด่น เช่น โครงงาน Smart Copper Sorter, กิจกรรมจิตอาสาครุศาสตร์, สื่อการสอน และระบบขยายดูภาพ (Lightbox Modal)
6. **ส่วนท้ายของเว็บ (Footer):** ข้อมูลผู้จัดทำตามที่กำหนดครบถ้วน 100%

---

## 🔐 ระบบภายในและการเข้าสู่ระบบแอดมิน (Hidden Admin System)
* **วิธีเปิดหน้าต่างล็อกอิน:**
  * กดคีย์ลัด **`Ctrl + L + O`** บนแป้นพิมพ์พร้อมกันจากหน้าใดก็ได้
  * หรือคลิกที่ไอคอนกุญแจลับ 🔒 เล็กๆ ที่มุมล่างขวาของส่วนท้ายเว็บ (Footer)
* **ข้อมูลเข้าสู่ระบบ:**
  * **ชื่อผู้ใช้งาน (Username):** `Bimmm`
  * **รหัสผ่าน (Password):** `Bumbim254720`

---

## ☁️ การเชื่อมต่อฐานข้อมูลคลาวด์ Supabase
เว็บไซต์รองรับการเชื่อมต่อกับ Supabase เพื่อให้ข้อมูลที่แก้ไขจากเครื่องคอมพิวเตอร์ของคุณบุ๋มบิ๋ม อัปเดตไปยังหน้าเว็บที่เปิดบน Vercel หรือมือถือได้แบบ Realtime:

1. สมัครใช้งานหรือเปิดโปรเจกต์ที่ [Supabase.com](https://supabase.com)
2. เข้าไปที่ **SQL Editor** แล้ววางคำสั่ง SQL ด้านล่างนี้เพื่อสร้างตาราง:

```sql
-- สร้างตารางสำหรับเก็บข้อมูล Portfolio
create table if not exists public.portfolio_data (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- เปิดใช้งานความปลอดภัย Row Level Security (RLS)
alter table public.portfolio_data enable row level security;

-- เปิดให้ทุกคนสามารถอ่านข้อมูลได้
create policy "Allow public read" on public.portfolio_data for select using (true);

-- เปิดให้อัปเดตและบันทึกข้อมูลได้
create policy "Allow anon insert" on public.portfolio_data for insert with check (true);
create policy "Allow anon update" on public.portfolio_data for update using (true);
```

3. คัดลอก **Project URL** และ **Anon Key (Public)** จากหน้า Settings > API ของ Supabase
4. ล็อกอินเข้าสู่ระบบแอดมินบนหน้าเว็บ (Ctrl+L+O) > เปิด **แผงควบคุม & ตกแต่ง** > เลือกแท็บ **"คลาวด์ Supabase"** > วาง URL และ Key แล้วกดปุ่ม **"บันทึกและทดสอบการเชื่อมต่อ"**
5. กดปุ่ม **"อัปโหลดขึ้นคลาวด์"** เป็นอันเสร็จสิ้น!

---

## 🚀 การนำขึ้น Vercel (1-Click Deploy)
1. กดที่ปุ่ม **Deploy with Vercel** หรือเข้าลิงก์:  
   [https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farochaboonlue2047-cmd%2Fportfolio](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farochaboonlue2047-cmd%2Fportfolio)
2. เข้าสู่ระบบ Vercel ด้วยบัญชี GitHub เดียวกัน (`arochaboonlue2047-cmd`)
3. กดปุ่ม **Deploy** (ระบบเตรียมไฟล์ `vercel.json` ไว้ให้แล้ว ไม่ต้องตั้งค่าใดๆ เพิ่มเติม)
4. รอประมาณ 30 วินาที จะได้รับโดเมน `.vercel.app` เช่น `bumbim-portfolio.vercel.app` พร้อมใช้งานทั่วโลกทันที!
