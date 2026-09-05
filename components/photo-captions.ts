/* Keterangan foto dalam bahasa Indonesia, dikunci NAMA BERKAS tanpa
   ekstensinya — dan nama berkas itulah yang jadi keterangan versi Inggrisnya.
   Jadi sisi Inggris tidak perlu ditulis dua kali: yang ada di sini hanya
   padanan Indonesianya.

   Berkas sendiri, bukan di dalam portfolio-runtime.js, karena ketiga
   pemakainya tidak sejenis: galeri (captionOf di runtime, sepenuhnya klien),
   lalu ubin Proyek Akhir di experience-journey.tsx dan academic-projects.tsx
   — keduanya Server Component, dan runtime itu menyentuh document/matchMedia
   di ruang modul sehingga tidak bisa diimpor dari sana.

   Istilah teknis sengaja dibiarkan Inggris — PCB, ODP, ROS2, LiDAR, PID,
   Precision/Recall, Preventive Maintenance — sama seperti di deskripsi proyek
   pada PROJECTS: itu memang kosakata yang dipakai di lapangan, dan
   menerjemahkannya justru membuat keterangannya lebih sulit dibaca.

   Foto baru WAJIB ditambahkan ke sini juga; tests/check-i18n.mjs menolak nama
   berkas yang belum punya barisnya. Nama bernomor ("7.webp") dan tangkapan
   layar tidak termasuk — keduanya dapat keterangan umum bernomor dari kamus
   UI, yang sudah dwibahasa. */
export const PHOTOS_ID: Record<string, string> = {
  '3 Axis Manipulator Robot': 'Robot Manipulator 3 Sumbu',
  '3 Phase Power Motor Circuit to Manually Turn the Steering Right and Left Using a 3 Phase Motor':
    'Rangkaian daya motor 3 fasa untuk memutar kemudi ke kanan dan ke kiri secara manual dengan motor 3 fasa',
  '3D PCB PDB (Power Distribution Board) Auxiliary': 'PCB 3D PDB (Power Distribution Board) Auxiliary',
  '3D PCB PDB (Power Distribution Board) Main': 'PCB 3D PDB (Power Distribution Board) Main',
  '3D Preview of the Assembled Sensor Board': 'Pratinjau 3D papan sensor yang sudah terpasang',
  'A trial using Yogyakarta City CCTV to detect vehicle speed and associated risk levels':
    'Uji coba memakai CCTV Kota Yogyakarta untuk mendeteksi kecepatan kendaraan dan tingkat risikonya',
  'AMX Electrical Team': 'Tim Kelistrikan AMX',
  'All Class Robots on the Race Track': 'Robot seluruh kelas di lintasan balap',
  'Appearance and Implementation during Attendance': 'Tampilan dan penerapannya saat presensi',
  'Application display for monitoring reading results': 'Tampilan aplikasi untuk memantau hasil pembacaan',
  'Application of Electric K3 during Installation': 'Penerapan K3 Listrik saat instalasi',
  'Attendance Recording Results in the Database': 'Hasil pencatatan presensi di basis data',
  'Automation Process For Annotating Vehicle Type Objects': 'Proses otomasi anotasi objek jenis kendaraan',
  'Become part of PT ANTAM (UBPP) Logam Mulia': 'Menjadi bagian dari PT ANTAM (UBPP) Logam Mulia',
  'Calculating the ODP port output utilized by users in the vicinity of a specified location or coordinate point':
    'Menghitung port keluaran ODP yang terpakai pengguna di sekitar lokasi atau titik koordinat tertentu',
  'Carrying out Preventive Maintenance in the Factory Area': 'Melakukan Preventive Maintenance di area pabrik',
  'Chassis Assembly Views from Every Angle': 'Tampilan rakitan sasis dari segala sudut',
  'Checking Component Placement on the Sensor Board': 'Memeriksa penempatan komponen di papan sensor',
  'Checking the conductivity value of the product water': 'Memeriksa nilai konduktivitas air produk',
  'Circuit Schematic for a Case Study of the Paint Mixing System Operational Process':
    'Skematik rangkaian studi kasus proses operasional sistem pencampuran cat',
  'Class Photo after the Line Follower Race': 'Foto bersama kelas seusai balap line follower',
  'Comparative Study Farewell': 'Perpisahan studi banding',
  'Component Checking before Implementation and Control Using ROS 2':
    'Pemeriksaan komponen sebelum implementasi dan kontrol dengan ROS 2',
  'Components of the Drone that are the System Center (GPS, I2C, etc.)':
    'Komponen drone yang menjadi pusat sistem (GPS, I2C, dll.)',
  'Computer Vision Based Vehicle Detection Results Us-Cover': 'Hasil deteksi kendaraan berbasis computer vision',
  'Conducting Research and Adjustment of Drone Components for PCB Design':
    'Menelaah dan menyesuaikan komponen drone untuk desain PCB',
  'Conducting operational testing on the HCl, NaOH, and demineralized water pumps to ensure smooth operation, the absence of excessive vibration, and stable rotation':
    'Menguji operasional pompa HCl, NaOH, dan air demineralisasi untuk memastikan kerjanya lancar, tanpa getaran berlebih, dan putarannya stabil',
  'Confidence Test Values on Objects During the Training Process': 'Nilai uji confidence pada objek selama proses training',
  'Control Testing of Robot Manipulators': 'Pengujian kontrol robot manipulator',
  'Control when the light is on': 'Kontrol saat lampu menyala',
  'Control when the lights are off': 'Kontrol saat lampu padam',
  'Core Parts of a Drone System': 'Bagian inti sistem drone',
  'Create simple applications for control systems': 'Membuat aplikasi sederhana untuk sistem kontrol',
  'Cutting the PCB according to the dimensions from the mechanical design':
    'Memotong PCB sesuai dimensi dari desain mekaniknya',
  'Data graph on Influxdb obtained from sensor readings': 'Grafik data di InfluxDB dari hasil pembacaan sensor',
  'Design Process for 3D Printing a Robot Manipulator Body': 'Proses desain cetak 3D bodi robot manipulator',
  'Detection and Classification Testing of Two Objects in a Single Frame':
    'Uji deteksi dan klasifikasi dua objek dalam satu frame',
  'Development and Testing of an Autonomous Line-Following Robot Using PID Control':
    'Pengembangan dan pengujian robot line follower otonom dengan kontrol PID',
  'Discuss the Work Programs Implemented in Each Association': 'Membahas program kerja yang dijalankan tiap himpunan',
  'Discussion on how mechanical systems in trains can generate an electricity supply':
    'Diskusi bagaimana sistem mekanik kereta bisa menghasilkan pasokan listrik',
  'Dividing the Dataset Results into Train, Valid, and Test': 'Membagi hasil dataset menjadi train, valid, dan test',
  'Documentation and Digitization Results of Preventive Maintenance Work Instructions':
    'Hasil dokumentasi dan digitalisasi instruksi kerja Preventive Maintenance',
  'Documenting and Counting Output Ports on ICONNET ODPs': 'Mendokumentasikan dan menghitung port keluaran pada ODP ICONNET',
  'Drone prototype that has been developed': 'Prototipe drone yang telah dikembangkan',
  'Each of them tells about what has been done and what can be improved in a group':
    'Masing-masing menceritakan apa yang sudah dikerjakan dan apa yang bisa diperbaiki dalam kelompoknya',
  'End of Ceremony and Declared as HMVE 2025 Management': 'Penutupan upacara dan pengukuhan sebagai pengurus HMVE 2025',
  'Ensuring Normal Voltage and Current in Production Machinery Components':
    'Memastikan tegangan dan arus komponen mesin produksi normal',
  'Entering Variables For Project Series': 'Memasukkan variabel untuk rangkaian proyek',
  'Event Activities Organized by the Electrical and Electronics Engineering Student Association':
    'Kegiatan acara yang diselenggarakan Himpunan Mahasiswa Teknik Elektro dan Elektronika',
  'Explanation of Material from the Supervisor': 'Penyampaian materi dari pembimbing',
  'Explanation of material related to the development of robotics in the industrial era 4.0':
    'Penjelasan materi tentang perkembangan robotika di era industri 4.0',
  'Explanation regarding the LRT Jakarta train operating system': 'Penjelasan tentang sistem operasi kereta LRT Jakarta',
  'Explanation regarding the working principle of the robot manipulator':
    'Penjelasan tentang prinsip kerja robot manipulator',
  'Final Demonstration in the Laboratory': 'Demonstrasi akhir di laboratorium',
  'Final Testing for Data Collection from Various Evaluations':
    'Pengujian akhir untuk pengambilan data dari berbagai evaluasi',
  'Fire Hazard Protection for Electrical Installations': 'Proteksi bahaya kebakaran pada instalasi listrik',
  'Forklift Simulator as a Learning Tool and Source of Preliminary Knowledge':
    'Simulator forklift sebagai alat belajar dan sumber pengetahuan awal',
  'Frequency and Severity Values in a Job': 'Nilai frequency dan severity dalam suatu pekerjaan',
  'Graph of data obtained from sensor readings': 'Grafik data dari hasil pembacaan sensor',
  'HMVE Entrepreneurship Division': 'Divisi Kewirausahaan HMVE',
  'HMVE Management Certificate 2025': 'Sertifikat kepengurusan HMVE 2025',
  'HMVE and HME Polines after discussions regarding the Entrepreneurship Division':
    'HMVE dan HME Polines seusai diskusi seputar Divisi Kewirausahaan',
  'How to Calculate and Management Risks at Work': 'Cara menghitung dan mengelola risiko di tempat kerja',
  'Industrial Visit to LRT Jakarta': 'Kunjungan industri ke LRT Jakarta',
  'Industrial Visit to PT Artifa Sukses Persada': 'Kunjungan industri ke PT Artifa Sukses Persada',
  'Industrial Visit to PT Infiniti Group': 'Kunjungan industri ke PT Infiniti Group',
  'Industrial Visit to PT LRT Jakarta at Velodrome Station': 'Kunjungan industri ke PT LRT Jakarta di Stasiun Velodrome',
  'Installing an adapter on a new ODP': 'Memasang adapter pada ODP baru',
  'Integration of Power and Communication Components for Robot Manipulator Testing':
    'Integrasi komponen daya dan komunikasi untuk pengujian robot manipulator',
  'Internship Documentation at PT ICON+ Makassar': 'Dokumentasi magang di PT ICON+ Makassar',
  'Internship Opening and Briefing': 'Pembukaan dan pengarahan magang',
  'Introduction to company work safety before entering the work area':
    'Pengenalan keselamatan kerja perusahaan sebelum masuk area kerja',
  'Introduction to the Functions and Output Formulas of Each Component':
    'Pengenalan fungsi dan rumus keluaran tiap komponen',
  'Inventory System Wiring Diagram': 'Wiring diagram sistem inventaris',
  'Learning How Micrometer Mechanical Measuring Instruments Work and Calculating Their Measurements (Case Study)':
    'Mempelajari cara kerja alat ukur mekanis mikrometer dan menghitung hasil pengukurannya (studi kasus)',
  'Learning How the Shove Term Works and Calculating Its Measurement (Case Study by Instructor)':
    'Mempelajari cara kerja jangka sorong dan menghitung hasil pengukurannya (studi kasus dari instruktur)',
  'Learning Materials for Implementing the MMLA Method in a Maintenance Unit':
    'Materi pembelajaran penerapan metode MMLA di unit maintenance',
  'Lecturers Who Receive and Convey Opinions Regarding Student Aspirations':
    'Dosen yang menerima dan menyampaikan pendapat atas aspirasi mahasiswa',
  'Logic Programming Implementation Process for Automated Systems Using OpenPLC Editor':
    'Proses implementasi pemrograman logika sistem otomasi dengan OpenPLC Editor',
  'MTTR Target Never Achieved': 'Target MTTR yang tidak pernah tercapai',
  'Matrix of Prediction Results for Existing Objects': 'Matriks hasil prediksi objek yang ada',
  'Measuring the Dimensions of a PCB and the Distance between Components':
    'Mengukur dimensi PCB dan jarak antarkomponen',
  'Meeting and Comparative Study of HMVE UNY and HME Polines': 'Pertemuan dan studi banding HMVE UNY dan HME Polines',
  'Meeting and Discussion of Material with Advisor': 'Pertemuan dan diskusi materi bersama pembimbing',
  'Meeting on Planning and Revising the MMLA Method': 'Rapat perencanaan dan revisi metode MMLA',
  'Meetings and explanations related to JAKI': 'Pertemuan dan penjelasan seputar JAKI',
  'Organic Detection Results from Model Training': 'Hasil deteksi organik dari training model',
  'Organic Object Detection Testing Based on Model Training Results':
    'Uji deteksi objek organik berdasarkan hasil training model',
  'Organizing PT. ICON+ Event Activities': 'Menyelenggarakan kegiatan acara PT ICON+',
  'PCB Layout Result': 'Hasil layout PCB',
  'PCBs on Robot and Drone Systems': 'PCB pada sistem robot dan drone',
  'Participants Who Take Part in Activities': 'Peserta yang mengikuti kegiatan',
  'Performing Maintenance on the Pneumatic Components of Production Machinery':
    'Melakukan perawatan komponen pneumatik mesin produksi',
  'Practical work in the Control Instrumentation Lab': 'Praktik di Lab Instrumentasi Kendali',
  'Preparing New ODPs for Installation at New Locations': 'Menyiapkan ODP baru untuk dipasang di lokasi baru',
  'Preparing ODP Components': 'Menyiapkan komponen ODP',
  'Preparing the Splitter for a New ODP': 'Menyiapkan splitter untuk ODP baru',
  'Presentation of Material Before Final Exam': 'Penyampaian materi menjelang ujian akhir',
  'Preventive Maintenance Preparation in the Smelting and Refining Section':
    'Persiapan Preventive Maintenance di bagian Smelting dan Refining',
  'Printing 3D Designs for Base, Elbow, and Shoulder Robot Manipulator':
    'Mencetak 3D desain base, elbow, dan shoulder robot manipulator',
  'Project Group Members after Final Presentation': 'Anggota kelompok proyek seusai presentasi akhir',
  'Project Implementation and Testing for Equipment Stock Borrowing and Return':
    'Implementasi dan pengujian proyek peminjaman dan pengembalian stok peralatan',
  'Providing Measuring and Measuring Instrument Materials and Implementing Them in Proteus':
    'Menyampaikan materi pengukuran dan alat ukur serta menerapkannya di Proteus',
  'Receive information from the office team regarding ODP locations that need to be surveyed':
    'Menerima informasi dari tim kantor tentang lokasi ODP yang perlu disurvei',
  'Reconstruction of the Previous MMLA Method as a Refinement':
    'Rekonstruksi metode MMLA sebelumnya sebagai penyempurnaan',
  "Recording each user's Presence in the Database": 'Mencatat kehadiran tiap pengguna di basis data',
  'Report Creation and Data Recapitulation': 'Pembuatan laporan dan rekapitulasi data',
  'Restructuring the MMLA method used by ANTAM based on the results of the meeting held':
    'Menyusun ulang metode MMLA yang dipakai ANTAM berdasarkan hasil rapat',
  'Results After Train and the Relationship between F1 Score and Confidence':
    'Hasil setelah training dan hubungan F1 Score dengan Confidence',
  'Results After Training and the Relationship between Precision and Recall':
    'Hasil setelah training dan hubungan Precision dengan Recall',
  'Results After Training and the Relationship between Recall and Confidence':
    'Hasil setelah training dan hubungan Recall dengan Confidence',
  'Results of Each Loss, Precision, and mAP value': 'Hasil tiap nilai Loss, Precision, dan mAP',
  "Results of a Final Quiz Designed to Measure Participants' Understanding of Tool Use in the Soldering Process":
    'Hasil kuis akhir untuk mengukur pemahaman peserta atas penggunaan alat dalam proses soldering',
  'Reverse Engineering (RE) Electric Drone Sprayer': 'Reverse Engineering (RE) Electric Drone Sprayer',
  'Risk Level Class from Calculation of Frequency and Severity Values':
    'Kelas tingkat risiko dari perhitungan nilai frequency dan severity',
  'Robot Assembly Modelling in Fusion 360': 'Pemodelan rakitan robot di Fusion 360',
  'Robot Communication Control and Testing via ROS2': 'Kontrol dan pengujian komunikasi robot lewat ROS2',
  'Robot Components for Remote Control Integration and LiDAR Sensor Detection':
    'Komponen robot untuk integrasi kendali jarak jauh dan deteksi sensor LiDAR',
  'Robot Control System using ROS2 in the Sorting Industry': 'Sistem kontrol robot dengan ROS2 di industri sortir',
  'Robot Crossing the Finish Line': 'Robot melewati garis finis',
  'Robot for sorting goods which is controlled directly from ROS2':
    'Robot penyortir barang yang dikendalikan langsung dari ROS2',
  'Robots Lined Up on the Track before a Run': 'Robot berbaris di lintasan sebelum dijalankan',
  'Schematic PCB PDB (Power Distribution Board) Auxiliary': 'Skematik PCB PDB (Power Distribution Board) Auxiliary',
  'Schematic PCB PDB (Power Distribution Board) Main': 'Skematik PCB PDB (Power Distribution Board) Main',
  'Seeing the development and transformation of tools in the field of robotics in industry 4.0':
    'Melihat perkembangan dan transformasi peralatan di bidang robotika pada industri 4.0',
  'Sensor Board PCB Layout in EasyEDA': 'Layout PCB papan sensor di EasyEDA',
  'Sensor Calibration on the Arduino Serial Monitor': 'Kalibrasi sensor lewat Serial Monitor Arduino',
  'Several Robot Developments Undertaken to Support Project Needs':
    'Beberapa pengembangan robot untuk menunjang kebutuhan proyek',
  'Simple simulation when applied to conveyor logic': 'Simulasi sederhana saat diterapkan pada logika konveyor',
  'Soldering and Voltage Check under a Magnifier': 'Menyolder dan memeriksa tegangan di bawah kaca pembesar',
  'Soldering the Etched Sensor Board': 'Menyolder papan sensor hasil etsa',
  'System Placement Design Following Room Mapping': 'Desain penempatan sistem mengikuti pemetaan ruangan',
  'System Placement Mapping': 'Pemetaan penempatan sistem',
  'Team Photo with the Finished Robots': 'Foto tim bersama robot yang sudah jadi',
  'Technical Drawing with Robot Dimensions': 'Gambar teknik beserta dimensi robot',
  'Testing of Inorganic Object Detection Based on Model Training Results':
    'Uji deteksi objek anorganik berdasarkan hasil training model',
  'The Circuit Component Responsible for Automation is That Every 4 Seconds, the Retail Valve Will Close and the Process Will Continue at the Mixing Stage':
    'Komponen rangkaian yang mengurus otomasinya: tiap 4 detik katup takar menutup dan prosesnya berlanjut ke tahap pencampuran',
  'The Circuit Component That Acts as a Counter Increases by 1 to 4 when the Third Mixing Cycle is Completed':
    'Komponen rangkaian yang berperan sebagai counter, naik 1 sampai 4 saat siklus pencampuran ketiga selesai',
  'The Process Responsible for Preventing the Addition of Materials During the Process Stirring Begins':
    'Proses yang mencegah penambahan bahan begitu pengadukan dimulai',
  'Training Certificate from BLKPP DIY': 'Sertifikat pelatihan dari BLKPP DIY',
  'Training Completion Certificate from Kemnaker SkillHub': 'Sertifikat kelulusan pelatihan dari SkillHub Kemnaker',
  'Training Results for Creating Models of Desired Objects': 'Hasil training pembuatan model objek yang diinginkan',
  "Training on the Implementation of the MMLA Method in the Company's Maintenance Department":
    'Pelatihan penerapan metode MMLA di departemen maintenance perusahaan',
  'Verify with the relevant office team regarding the number of ports currently in use by nearby users at the specified ODP coordinates':
    'Memastikan ke tim kantor terkait jumlah port yang sedang dipakai pengguna sekitar pada koordinat ODP tersebut',
  'Verifying PCB Trace Connectivity': 'Memeriksa konektivitas jalur PCB',
  'Vibration Check on Scrubber Motor for Work Instruction Documentation':
    'Pemeriksaan getaran motor scrubber untuk dokumentasi instruksi kerja',
  'Waiting for ODP coordinates after identifying the location to be surveyed':
    'Menunggu koordinat ODP setelah lokasi yang akan disurvei ditentukan',
  'Welcoming the New HMVE Management for the 2025 Period': 'Menyambut pengurus baru HMVE periode 2025',
  'X-30L Drone System Wiring Diagram': 'Wiring diagram sistem drone X-30L',
  'mAP50, Loss, Precision, and Recall Results from the Training Dataset':
    'Hasil mAP50, Loss, Precision, dan Recall dari dataset training',
  'the PCB part of the power drone that supplies all voltage and current to the system and propeller':
    'Bagian PCB daya drone yang memasok seluruh tegangan dan arus ke sistem dan propeler',
};

/** Keterangan Indonesia untuk satu nama berkas; jatuh ke namanya sendiri
    kalau belum diterjemahkan — foto yang terlewat tampil apa adanya, bukan
    hilang. Dipakai markup Server Component; galeri punya jalurnya sendiri di
    captionOf karena di sana ada juga nama bernomor yang jadi "Dokumentasi 3". */
export const captionID = (file: string) => {
  const nama = file.replace(/\.[^.]+$/, '');
  return PHOTOS_ID[nama] || nama;
};
