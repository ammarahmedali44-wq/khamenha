export const categoriesList = [
  { id: 'space', name: 'فضاء وكواكب ' },
  { id: 'ocean', name: 'عالم البحار ' },
  { id: 'egypt', name: 'مصر أم الدنيا ' },
  { id: 'america', name: 'أمريكا ' },
  { id: 'KSA', name: 'المملكة العربية السعودية ' },
  { id: 'egyptian_series', name: 'مسلسلات مصرية ' },
  { id: 'history', name: 'تاريخ عام ' },
  { id: 'animals', name: 'حيوانات ' },
  { id: 'prophetic_biography', name: 'سيرة نبوية ' },
  { id: 'jurisprudence', name: 'فقه ومصطلحات ' },
  { id: 'health', name: 'طب وصحة ' },
  { id: 'football', name: 'كرة القدم ' },
  { id: 'chemistry', name: 'كيمياء ' },
  { id: 'biology', name: 'أحياء ' },
  { id: 'video_games', name: 'ألعاب فيديو ' },
  { id: 'world_laws', name: 'قوانين العالم ' },
  { id: 'riddles', name: 'ألغاز وفوازير ' },
  { id: 'currency', name: 'عملات الدول ' },
  { id: 'car_logos', name: 'شعارات سيارات ' },
  { id: 'general', name: 'معلومات عامة ' },
  { id : 'kuwait', name: 'الكويت ' }
];

export const getCategoryName = (id) => {
  const cat = categoriesList.find(c => c.id === id);
  return cat ? cat.name : id;
};