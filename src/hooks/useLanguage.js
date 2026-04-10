import { useState } from 'react'

const translations = {
  en: {
    // Scanner
    hint: 'Point camera at student QR code',
    present: 'Present', late: 'Late', error: 'Error',
    already: 'Already recorded today',
    not_found: 'Student not found',
    holiday: 'On approved holiday',
    status_present: 'PRESENT ✓',
    status_late: 'LATE ⏰',
    status_dup: 'DUPLICATE',
    status_error: 'ERROR',
    time_prefix: 'Scanned at',
    // Nav
    nav_scanner: 'Scanner',
    nav_dashboard: 'Dashboard',
    nav_students: 'Students',
    nav_holidays: 'Holidays',
    nav_events: 'Events',
    nav_reports: 'Reports',
    // Dashboard
    dash_title: 'Today\'s Overview',
    dash_branch: 'Branch',
    dash_total: 'Total',
    dash_rate: 'Rate',
    // Students
    add_student: 'Add Student',
    student_name: 'Full Name',
    student_no: 'Student No.',
    select_branch: 'Select Branch',
    select_class: 'Select Class',
    generate_qr: 'Generate QR',
    download_qr: 'Download QR',
    // Holidays
    add_holiday: 'Add Holiday',
    start_date: 'Start Date',
    end_date: 'End Date',
    reason: 'Reason',
    // Common
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    search: 'Search...',
  },
  bm: {
    // Scanner
    hint: 'Arahkan kamera ke QR kod pelajar',
    present: 'Hadir', late: 'Lewat', error: 'Ralat',
    already: 'Sudah direkod hari ini',
    not_found: 'Pelajar tidak dijumpai',
    holiday: 'Cuti diluluskan',
    status_present: 'HADIR ✓',
    status_late: 'LEWAT ⏰',
    status_dup: 'PENDUA',
    status_error: 'RALAT',
    time_prefix: 'Diimbas pada',
    // Nav
    nav_scanner: 'Pengimbas',
    nav_dashboard: 'Papan Pemuka',
    nav_students: 'Pelajar',
    nav_holidays: 'Cuti',
    nav_events: 'Acara',
    nav_reports: 'Laporan',
    // Dashboard
    dash_title: 'Ringkasan Hari Ini',
    dash_branch: 'Cawangan',
    dash_total: 'Jumlah',
    dash_rate: 'Kadar',
    // Students
    add_student: 'Tambah Pelajar',
    student_name: 'Nama Penuh',
    student_no: 'No. Pelajar',
    select_branch: 'Pilih Cawangan',
    select_class: 'Pilih Kelas',
    generate_qr: 'Jana QR',
    download_qr: 'Muat Turun QR',
    // Holidays
    add_holiday: 'Tambah Cuti',
    start_date: 'Tarikh Mula',
    end_date: 'Tarikh Tamat',
    reason: 'Sebab',
    // Common
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuatkan...',
    search: 'Cari...',
  },
}

export function useLanguage() {
  const [lang, setLang] = useState('en')
  const t = (key) => translations[lang][key] || key
  return { lang, setLang, t }
}
