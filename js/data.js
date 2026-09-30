/**
 * Default Data for Arocha Boonlue (Bumbim) Portfolio
 * Electrical Industry Education, RMUTI Khon Kaen
 */

const DEFAULT_PORTFOLIO_DATA = {
  profile: {
    name: "นางสาวอโรชา บุญเหลือ",
    nickname: "บุ๋มบิ๋ม",
    title: "นักศึกษาครุศาสตร์อุตสาหกรรมไฟฟ้า",
    studentId: "68322110251-2",
    university: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น",
    faculty: "คณะครุศาสตร์อุตสาหกรรม",
    major: "สาขาครุศาสตร์อุตสาหกรรมไฟฟ้า",
    phone: "0832482556",
    email: "arochaboonlue2047@gmail.com",
    birthdate: "20 เมษายน 2547",
    age: "22 ปี",
    nationality: "ไทย",
    ethnicity: "ไทย",
    avatar: "assets/images/profile_1.jpg?v=20261001",
    bio: "มุ่งมั่นในการเรียนรู้ทั้งด้านวิศวกรรมไฟฟ้าและการถ่ายทอดความรู้ในฐานะครูช่าง มีความเชี่ยวชาญด้านการออกแบบวงจรดิจิทัล การเขียนแบบไฟฟ้าด้วย CAD และการจัดทำสื่อการเรียนการสอนที่มีประสิทธิภาพ",
    motto: "ความรู้ทางวิชาการสร้างรากฐาน ความมุ่งมั่นและการปฏิบัติจริงสร้างอนาคต",
    statusBadge: "พร้อมเรียนรู้และสร้างสรรค์นวัตกรรม",
    socials: {
      line: "0832482556",
      facebook: "Arocha Boonlue",
      github: ""
    }
  },

  stats: [
    { label: "เกรดเฉลี่ย ปวส.", value: "3.85", icon: "award", badge: "เกียรตินิยมอันดับ 1" },
    { label: "เกรดเฉลี่ย ปวช.", value: "3.80", icon: "star", badge: "เกียรตินิยม" },
    { label: "โครงงาน & ผลงาน", value: "15+", icon: "folder-check", badge: "ชิ้นงานคุณภาพ" },
    { label: "ชั่วโมงจิตอาสา & กิจกรรม", value: "60+", icon: "heart", badge: "พัฒนาสังคม" }
  ],

  skills: [
    {
      category: "วิศวกรรมไฟฟ้า & ดิจิทัล (Electrical & Digital)",
      items: [
        { name: "Digital Logic Circuit & ICs (74LS Series)", level: 90 },
        { name: "Proteus ISIS Circuit Simulation", level: 92 },
        { name: "AutoCAD Electrical (2D/3D Wiring)", level: 88 },
        { name: "การออกแบบและติดตั้งระบบไฟฟ้าภายในอาคาร", level: 85 },
        { name: "เครื่องกลไฟฟ้าและการควบคุมมอเตอร์", level: 82 }
      ]
    },
    {
      category: "วิชาชีพครูและการถ่ายทอดความรู้ (Pedagogy & Teaching)",
      items: [
        { name: "การออกแบบหลักสูตรและแผนการจัดการเรียนรู้", level: 90 },
        { name: "การพัฒนาสื่อการสอนและใบงานฝึกปฏิบัติการ", level: 88 },
        { name: "การวัดและประเมินผลทักษะวิชาชีพช่าง", level: 85 },
        { name: "จิตวิทยาครุศาสตร์และการแนะแนวผู้เรียน", level: 88 }
      ]
    },
    {
      category: "คอมพิวเตอร์และเทคโนโลยี (Tech & Tools)",
      items: [
        { name: "Microsoft Office (Word, PowerPoint, Excel)", level: 95 },
        { name: "Scratch & Coding Fundamentals", level: 85 },
        { name: "งานนำเสนอและการตัดต่อสื่อมัลติมีเดีย", level: 88 }
      ]
    }
  ],

  education: [
    {
      id: "edu-1",
      level: "ระดับประถมศึกษา",
      institution: "โรงเรียนบ้านเป้า",
      period: "พ.ศ. 2553 - 2559",
      gpa: "3.50",
      description: "สำเร็จการศึกษาระดับประถมศึกษาด้วยผลการเรียนดีเด่น ปลูกฝังวินัยและความสนใจในวิทยาศาสตร์และเทคโนโลยี",
      badge: "เกรดเฉลี่ย 3.50"
    },
    {
      id: "edu-2",
      level: "ระดับมัธยมศึกษาตอนต้น",
      institution: "โรงเรียนลืออำนาจวิทยาคม",
      period: "พ.ศ. 2559 - 2562",
      gpa: "3.33",
      description: "สำเร็จการศึกษาระดับมัธยมศึกษาตอนต้น เข้าร่วมกิจกรรมวิชาการและการประกวดโครงงานอย่างต่อเนื่อง",
      badge: "เกรดเฉลี่ย 3.33"
    },
    {
      id: "edu-3",
      level: "ระดับประกาศนียบัตรวิชาชีพ (ปวช.)",
      institution: "วิทยาลัยเทคนิคหัวตะพาน",
      period: "พ.ศ. 2562 - 2565",
      gpa: "3.80",
      description: "สาขาวิชาช่างไฟฟ้ากำลัง เรียนรู้พื้นฐานงานไฟฟ้า งานติดตั้ง วงจรควบคุม และทักษะช่างอุตสาหกรรม ได้รับเกียรตินิยม",
      badge: "เกียรตินิยม (GPA 3.80)"
    },
    {
      id: "edu-4",
      level: "ระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส. อนุปริญญา)",
      institution: "วิทยาลัยเทคนิคหัวตะพาน",
      period: "พ.ศ. 2565 - 2567",
      gpa: "3.85",
      description: "สาขาวิชาไฟฟ้ากำลัง เชี่ยวชาญการออกแบบวงจรลอจิกดิจิทัล การควบคุมอัตโนมัติ และระบบไฟฟ้าโรงงาน สำเร็จการศึกษาด้วยเกียรตินิยมอันดับ 1",
      badge: "เกียรตินิยมอันดับ 1 (GPA 3.85)"
    },
    {
      id: "edu-5",
      level: "ระดับปริญญาตรี (กำลังศึกษา)",
      institution: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น",
      period: "พ.ศ. 2567 - ปัจจุบัน",
      gpa: "กำลังศึกษา",
      description: "คณะครุศาสตร์อุตสาหกรรม สาขาครุศาสตร์อุตสาหกรรมไฟฟ้า มุ่งเน้นการเป็นครูช่างไฟฟ้ามืออาชีพ ผสานความเชี่ยวชาญทางวิศวกรรมไฟฟ้าเข้ากับหลักการสอนสมัยใหม่",
      badge: "ปริญญาตรี ครุศาสตร์ไฟฟ้า"
    }
  ],

  courses: [
    {
      id: "course-1",
      code: "EE-301",
      name: "การออกแบบวงจรดิจิทัลและลอจิก (Digital & Logic Circuits)",
      category: "วิศวกรรมไฟฟ้า",
      description: "การวิเคราะห์และออกแบบวงจรดิจิทัลคอมบิเนชันและซีเควนเชียล การใช้อุปกรณ์ลอจิกเกต เคาน์เตอร์ ถอดรหัสสัญญาณ และการจำลองด้วย Proteus ISIS",
      files: [
        {
          name: "เอกสารประมวลรายวิชา (Syllabus) EE-301.pdf",
          url: "assets/docs/smart_copper_sorter.pdf",
          type: "application/pdf",
          size: "2.4 MB"
        },
        {
          name: "แบบจำลองวงจร Proteus Logic Gate Simulator.zip",
          url: "assets/docs/smart_copper_sorter.pdf",
          type: "application/zip",
          size: "5.1 MB"
        }
      ],
      artifacts: [
        {
          title: "แบบจำลองวงจรนับเลขดิจิทัล 00-46 ด้วย IC 74LS90 และ IC 74LS49",
          desc: "ออกแบบและจำลองวงจรนับความถี่อัตโนมัติ แสดงผลผ่าน 7-Segment สองหลัก พร้อมระบบรีเซ็ตตามเงื่อนไข",
          file: "assets/docs/smart_copper_sorter.pdf",
          type: "Proteus Simulation & Report",
          files: [
            {
              name: "รายงานการทดลองวงจรนับเลขดิจิทัล.pdf",
              url: "assets/docs/smart_copper_sorter.pdf",
              type: "application/pdf",
              size: "1.8 MB"
            },
            {
              name: "ตารางวิเคราะห์ความจริง State Diagram Truth Table.xlsx",
              url: "assets/docs/smart_copper_sorter.pdf",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              size: "340 KB"
            }
          ]
        },
        {
          title: "วงจรนับลำดับตัวเลข 0-2-3-5-1-4 ด้วย Flip-Flop 7476",
          desc: "การออกแบบตารางสถานะ State Diagram และประกอบวงจรจริงเพื่อควบคุมลำดับสัญญาณไฟสัญจร",
          file: "",
          type: "State Machine Design",
          files: [
            {
              name: "แบบผังวงจร State Diagram Flip-Flop.pdf",
              url: "assets/docs/smart_copper_sorter.pdf",
              type: "application/pdf",
              size: "1.2 MB"
            }
          ]
        }
      ]
    },
    {
      id: "course-2",
      code: "CAD-202",
      name: "การเขียนแบบไฟฟ้าด้วยคอมพิวเตอร์ (AutoCAD Electrical)",
      category: "การออกแบบทางวิศวกรรม",
      description: "การใช้โปรแกรม AutoCAD เขียนแบบระบบไฟฟ้า แผนผังการเดินสาย (Single Line Diagram) การจัดวางอุปกรณ์ในตู้คอนโทรล และสัญลักษณ์มาตรฐานสากล",
      files: [
        {
          name: "แผนการจัดการเรียนรู้ AutoCAD Electrical CAD-202.pdf",
          url: "assets/docs/electrical_training_course.pdf",
          type: "application/pdf",
          size: "3.2 MB"
        },
        {
          name: "ชุดไฟล์พิมพ์เขียวเขียนแบบวงจรตู้คอนโทรล.dwg",
          url: "assets/docs/electrical_training_course.pdf",
          type: "application/acad",
          size: "8.6 MB"
        }
      ],
      artifacts: [
        {
          title: "ชุดแบบเขียนงานไฟฟ้า CAD01 - CAD06 AROCHA",
          desc: "แบบร่างทางวิศวกรรมไฟฟ้าเต็มรูปแบบ ประกอบด้วยผังควบคุมมอเตอร์ ผังจ่ายโหลด และตู้สวิตช์บอร์ด",
          file: "assets/docs/electrical_training_course.pdf",
          type: "CAD Blueprints & Schema",
          files: [
            {
              name: "ชุดเขียนแบบพิมพ์เขียววิศวกรรมไฟฟ้า CAD01-CAD06.pdf",
              url: "assets/docs/electrical_training_course.pdf",
              type: "application/pdf",
              size: "3.5 MB"
            }
          ]
        }
      ]
    },
    {
      id: "course-3",
      code: "PED-101",
      name: "จิตวิทยาครูและหลักสูตรการสอนครุศาสตร์อุตสาหกรรม",
      category: "วิชาชีพครู",
      description: "การพัฒนาหลักสูตรรายวิชาช่าง การจัดทำแผนการสอน Active Learning จิตวิทยาการเรียนรู้สำหรับนักศึกษาวิชาชีพ และจรรยาบรรณวิชาชีพครู",
      files: [
        {
          name: "ประมวลการสอนและแผนการประเมินทักษะครู PED-101.pdf",
          url: "assets/docs/activity_pedagogy.pdf",
          type: "application/pdf",
          size: "1.5 MB"
        },
        {
          name: "สไลด์นำเสนอ จิตวิทยาการศึกษาสำหรับครูช่าง.pptx",
          url: "assets/docs/activity_pedagogy.pdf",
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          size: "4.7 MB"
        }
      ],
      artifacts: [
        {
          title: "รายงานและคู่มือ: คุณลักษณะของครูที่ดีในยุคดิจิทัล",
          desc: "การวิเคราะห์บทบาทครูช่างยุคใหม่ การบูรณาการเทคโนโลยี AI และการสร้างแรงบันดาลใจให้แก่ผู้เรียนสายอาชีพ",
          file: "assets/docs/activity_pedagogy.pdf",
          type: "Pedagogy Research & Slides",
          files: [
            {
              name: "รายงานวิจัยคุณลักษณะครูช่างยุคดิจิทัล.pdf",
              url: "assets/docs/activity_pedagogy.pdf",
              type: "application/pdf",
              size: "2.2 MB"
            }
          ]
        },
        {
          title: "หลักสูตรระยะสั้นการฝึกอบรมช่างไฟฟ้าภายในอาคาร",
          desc: "การพัฒนาหลักสูตรฝึกอบรมภาคปฏิบัติสำหรับประชาชนและช่างชุมชน เสริมทักษะความปลอดภัยและมาตรฐาน วสท.",
          file: "assets/docs/electrical_training_course.pdf",
          type: "Training Curriculum",
          files: [
            {
              name: "เอกสารหลักสูตรอบรมระยะสั้น 30 ชั่วโมง.pdf",
              url: "assets/docs/electrical_training_course.pdf",
              type: "application/pdf",
              size: "1.9 MB"
            }
          ]
        }
      ]
    },
    {
      id: "course-4",
      code: "EE-304",
      name: "การติดตั้งระบบไฟฟ้าและมาตรฐานความปลอดภัย (Electrical Installation)",
      category: "วิศวกรรมไฟฟ้า",
      description: "การคำนวณขนาดสายไฟ พิกัดเบรกเกอร์ ระบบการต่อลงดิน และมาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย (วสท.)",
      files: [
        {
          name: "คู่มือมาตรฐานการติดตั้งไฟฟ้า วสท. 2568.pdf",
          url: "assets/docs/electrical_training_course.pdf",
          type: "application/pdf",
          size: "4.5 MB"
        }
      ],
      artifacts: [
        {
          title: "รายงานการคำนวณโหลดและการติดตั้งระบบไฟฟ้าอาคารฝึกงาน",
          desc: "ตารางคำนวณโหลดรวม การเลือกขนาดหม้อแปลงและอุปกรณ์ป้องกันไฟฟ้ารั่วตามมาตรฐานสากล",
          file: "",
          type: "Calculation Sheet & Layout",
          files: [
            {
              name: "ตารางการคำนวณโหลดทางไฟฟ้า Electrical Load Schedule.xlsx",
              url: "assets/docs/electrical_training_course.pdf",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              size: "620 KB"
            }
          ]
        }
      ]
    }
  ],

  activities: [
    {
      id: "act-1",
      title: "โครงการ Smart Copper Sorter (เครื่องคัดแยกทองแดงอัจฉริยะ)",
      category: "โครงงานนวัตกรรม",
      date: "กรกฎาคม 2568",
      image: "assets/images/activity_1.jpg",
      description: "พัฒนาเครื่องคัดแยกทองแดงและโลหะอัจฉริยะด้วยเซนเซอร์ตรวจจับและระบบกลไกอัตโนมัติ เพื่อเพิ่มประสิทธิภาพในการรีไซเคิลวัสดุทางวิศวกรรม",
      tags: ["นวัตกรรม", "วิศวกรรมไฟฟ้า", "ระบบอัตโนมัติ"],
      document: "assets/docs/smart_copper_sorter.pdf",
      files: [
        {
          name: "รูปถ่ายต้นแบบเครื่องคัดแยกทองแดง.jpg",
          url: "assets/images/activity_1.jpg",
          type: "image/jpeg",
          size: "1.2 MB"
        },
        {
          name: "รายงานโครงงานนวัตกรรมเครื่องคัดแยกทองแดงฉบับสมบูรณ์.pdf",
          url: "assets/docs/smart_copper_sorter.pdf",
          type: "application/pdf",
          size: "4.2 MB"
        },
        {
          name: "วิดีโอสาธิตการทำงานของระบบเซนเซอร์และกลไกคัดแยก.mp4",
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          type: "video/mp4",
          size: "12.5 MB"
        },
        {
          name: "วงจรควบคุมและแบบจำลองโครงสร้างกลไก.dwg",
          url: "assets/docs/smart_copper_sorter.pdf",
          type: "application/acad",
          size: "2.8 MB"
        }
      ]
    },
    {
      id: "act-2",
      title: "กิจกรรมจิตอาสาและพัฒนาทักษะวิชาชีพครุศาสตร์ช่าง",
      category: "จิตอาสา & สังคม",
      date: "กันยายน 2568",
      image: "assets/images/activity_2.jpg",
      description: "ร่วมทีมบำเพ็ญประโยชน์ ตรวจเช็กระบบไฟฟ้าและเปลี่ยนอุปกรณ์ไฟฟ้าส่องสว่างให้แก่โรงเรียนในชนบทและชุมชน",
      tags: ["จิตอาสา", "พัฒนาชุมชน", "บริการวิชาชีพ"],
      document: "assets/docs/activity_pedagogy.pdf",
      files: [
        {
          name: "ภาพกิจกรรมจิตอาสาพัฒนาโรงเรียนชุมชน.jpg",
          url: "assets/images/activity_2.jpg",
          type: "image/jpeg",
          size: "950 KB"
        },
        {
          name: "สรุปผลการดำเนินงานจิตอาสาและแบบประเมินความพึงพอใจ.pdf",
          url: "assets/docs/activity_pedagogy.pdf",
          type: "application/pdf",
          size: "2.1 MB"
        },
        {
          name: "สไลด์สรุปกิจกรรมจิตอาสาและพัฒนาทักษะวิชาชีพ.pptx",
          url: "assets/docs/activity_pedagogy.pdf",
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          size: "3.4 MB"
        }
      ]
    },
    {
      id: "act-3",
      title: "การจัดอบรมหลักสูตรระยะสั้นช่างไฟฟ้าภายในอาคาร",
      category: "การสอน & อบรม",
      date: "มีนาคม 2569",
      image: "assets/images/activity_3.jpg",
      description: "ทำหน้าที่เป็นผู้ช่วยวิทยากรฝึกอบรมทักษะการเดินสายไฟในท่อร้อยสายและการติดตั้งตู้ Consumer Unit ให้แก่ผู้เรียนสายอาชีพ",
      tags: ["การสอน", "หลักสูตรระยะสั้น", "วิทยากร"],
      document: "assets/docs/electrical_training_course.pdf",
      files: [
        {
          name: "ภาพการฝึกอบรมการเดินสายไฟในอาคาร.jpg",
          url: "assets/images/activity_3.jpg",
          type: "image/jpeg",
          size: "1.1 MB"
        },
        {
          name: "หลักสูตรฝึกอบรมช่างไฟฟ้าและคู่มือความปลอดภัย วสท..pdf",
          url: "assets/docs/electrical_training_course.pdf",
          type: "application/pdf",
          size: "3.8 MB"
        },
        {
          name: "ตารางประเมินผลการฝึกอบรมและสถิติผู้ผ่านการอบรม.xlsx",
          url: "assets/docs/electrical_training_course.pdf",
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          size: "420 KB"
        }
      ]
    },
    {
      id: "act-4",
      title: "การจำลองและประกอบบอร์ดวงจร Digital Logic Trainer",
      category: "ชิ้นงานในรายวิชา",
      date: "มกราคม 2569",
      image: "assets/images/profile_3.jpg",
      description: "ประกอบแผงทดลองวงจรลอจิกดิจิทัลสำหรับนักศึกษา เพื่อใช้ในการเรียนการสอนวิชาวงจรดิจิทัล ภาคปฏิบัติการ",
      tags: ["สื่อการสอน", "ดิจิทัลลอจิก", "แผงทดลอง"],
      document: "",
      files: [
        {
          name: "ภาพแผงทดลอง Digital Logic Trainer.jpg",
          url: "assets/images/profile_3.jpg",
          type: "image/jpeg",
          size: "820 KB"
        },
        {
          name: "คู่มือการใช้งานและใบงานการทดลองดิจิทัลลอจิก.pdf",
          url: "assets/docs/smart_copper_sorter.pdf",
          type: "application/pdf",
          size: "1.9 MB"
        },
        {
          name: "ไฟล์โค้ดจำลองการทำงานและเฟิร์มแวร์ทดสอบ.zip",
          url: "assets/docs/smart_copper_sorter.pdf",
          type: "application/zip",
          size: "1.4 MB"
        }
      ]
    }
  ],

  themeSettings: {
    preset: "sakura", // sakura | peach | mint | lavender | ocean
    darkMode: false,
    fontFamily: "Prompt", // Prompt | Kanit | Sarabun | Inter
    cardRadius: "rounded", // soft (8px) | rounded (16px) | pill (24px)
    floatingSparkles: true,
    soundEffects: true,
    hoverLift: true,
    customFonts: []
  }
};
