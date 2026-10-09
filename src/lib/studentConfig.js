export const STUDENT_NAMES = {
  'muhammadwahyudin0701@gmail.com': 'M.Wahyudin',
  'rayanadamgunawan@gmail.com': 'Rayyan Adam Gunawan',
  'khozinsapzidan@gmail.com': 'Khozin Sapzidan'
};

export function getStudentName(email) {
  if (!email) return 'Peserta';
  return STUDENT_NAMES[email] || email.split('@')[0];
}
