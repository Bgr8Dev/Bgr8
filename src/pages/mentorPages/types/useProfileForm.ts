import { useState } from 'react';
import { UserType, MENTOR, MENTEE, ProfileFormData, ValidationErrors, SectionStatus, FormProgress } from '../types/mentorTypes';
// import ukEducationLevels from '../../../constants/ukEducationLevels';

export const useProfileForm = (selectedRole: UserType | null) => {
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    degree: '',
    educationLevel: '',
    county: '',
    profession: '',
    pastProfessions: [''],
    linkedin: '',
    calCom: '',
    hobbies: [],
    ethnicity: '',
    religion: '',
    skills: [],
    lookingFor: [],
    industries: [],
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field: keyof ProfileFormData, value: string[]) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user makes changes
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePastProfessionChange = (index: number, value: string) => {
    const newPastProfessions = [...profileForm.pastProfessions];
    newPastProfessions[index] = value;
    handleArrayChange('pastProfessions', newPastProfessions);
  };

  const addPastProfession = () => {
    handleArrayChange('pastProfessions', [...profileForm.pastProfessions, '']);
  };

  const removePastProfession = (index: number) => {
    if (profileForm.pastProfessions.length > 1) {
      const newPastProfessions = profileForm.pastProfessions.filter((_, i) => i !== index);
      handleArrayChange('pastProfessions', newPastProfessions);
    }
  };

  const calculateFormProgress = (): FormProgress => {
    let completedFields = 0;
    let totalFields = 0;
    
    // Personal Information (6 fields)
    totalFields += 6;
    if (profileForm.firstName.trim()) completedFields++;
    if (profileForm.lastName.trim()) completedFields++;
    if (profileForm.email.trim()) completedFields++;
    if (profileForm.phone.trim()) completedFields++;
    if (profileForm.age.trim()) completedFields++;
    if (profileForm.county.trim()) completedFields++;
    
    // Education & Career (4 fields for mentees, 5 for mentors)
    if (selectedRole === MENTOR) {
      totalFields += 5; // degree, educationLevel, profession, linkedin, pastProfessions
      if (profileForm.degree.trim()) completedFields++;
      if (profileForm.educationLevel.trim()) completedFields++;
      if (profileForm.profession.trim()) completedFields++;
      if (profileForm.linkedin.trim()) completedFields++;
      if (profileForm.pastProfessions.some(p => p.trim())) completedFields++;
    } else {
      totalFields += 3; // degree, educationLevel, profession (no linkedin or pastProfessions for mentees)
      if (profileForm.degree.trim()) completedFields++;
      if (profileForm.educationLevel.trim()) completedFields++;
      if (profileForm.profession.trim()) completedFields++;
    }
    
    // Skills & Interests (3 fields)
    totalFields += 3;
    if (profileForm.skills.length > 0) completedFields++;
    if (profileForm.industries.length > 0) completedFields++;
    if (profileForm.hobbies.length > 0) completedFields++;
    
    // Additional Information (2 fields)
    totalFields += 2;
    if (profileForm.ethnicity.trim()) completedFields++;
    if (profileForm.religion.trim()) completedFields++;
    
    // Looking For (1 field - for mentees only)
    if (selectedRole === MENTEE) {
      totalFields += 1;
      if (profileForm.lookingFor.length > 0) completedFields++;
    }
    
    return { completedFields, totalFields };
  };

  const getMissingFields = (): string[] => {
    const missingFields: string[] = [];
    
    if (!profileForm.firstName.trim()) missingFields.push('First Name');
    if (!profileForm.lastName.trim()) missingFields.push('Last Name');
    if (!profileForm.email.trim()) missingFields.push('Email');
    if (!profileForm.phone.trim()) missingFields.push('Phone Number');
    if (!profileForm.age.trim()) missingFields.push('Age');
    if (!profileForm.county.trim()) missingFields.push('County');
    if (!profileForm.degree.trim()) missingFields.push('Degree/Qualification');
    if (!profileForm.educationLevel.trim()) missingFields.push('Education Level');
    if (!profileForm.profession.trim()) missingFields.push('Profession');
    
    // LinkedIn is only required for mentors
    if (selectedRole === MENTOR && !profileForm.linkedin.trim()) {
      missingFields.push('LinkedIn Profile');
    }
    
    if (profileForm.skills.length === 0) missingFields.push('Skills');
    if (profileForm.industries.length === 0) missingFields.push('Industries');
    if (profileForm.hobbies.length === 0) missingFields.push('Hobbies & Interests');
    if (!profileForm.ethnicity.trim()) missingFields.push('Ethnicity');
    if (!profileForm.religion.trim()) missingFields.push('Religion');
    
    // Past Professions only required for mentors
    if (selectedRole === MENTOR && !profileForm.pastProfessions.some(p => p.trim())) {
      missingFields.push('Past Professions');
    }
    
    // Looking For only required for mentees
    if (selectedRole === MENTEE && profileForm.lookingFor.length === 0) {
      missingFields.push('Learning Goals');
    }
    
    return missingFields;
  };

  const getSectionStatus = (): SectionStatus => {
    const sections: SectionStatus = {
      'Personal Information': {
        completed: Boolean(profileForm.firstName.trim() && profileForm.lastName.trim() && 
                   profileForm.email.trim() && profileForm.phone.trim() && 
                   profileForm.age.trim() && profileForm.county.trim()),
        total: 6
      },
      'Education & Career': {
        completed: selectedRole === MENTOR 
          ? Boolean(profileForm.degree.trim() && profileForm.educationLevel.trim() && 
                     profileForm.profession.trim() && profileForm.linkedin.trim())
          : Boolean(profileForm.degree.trim() && profileForm.educationLevel.trim() && 
                     profileForm.profession.trim()),
        total: selectedRole === MENTOR ? 4 : 3
      },
      'Skills & Interests': {
        completed: profileForm.skills.length > 0 && profileForm.industries.length > 0 && 
                   profileForm.hobbies.length > 0,
        total: 3
      },
      'Additional Information': {
        completed: Boolean(profileForm.ethnicity.trim() && profileForm.religion.trim()),
        total: 2
      }
    };
    
    // Professional Background section only for mentors
    if (selectedRole === MENTOR) {
      sections['Professional Background'] = {
        completed: profileForm.pastProfessions.some(p => p.trim()),
        total: 1
      };
    }
    
    // Learning Goals section only for mentees
    if (selectedRole === MENTEE) {
      sections['Learning Goals'] = {
        completed: profileForm.lookingFor.length > 0,
        total: 1
      };
    }
    
    return sections;
  };

  const validateProfileForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    // Personal Information
    if (!profileForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!profileForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!profileForm.email.trim()) errors.email = 'Email is required';
    if (!profileForm.phone.trim()) errors.phone = 'Phone number is required';
    if (!profileForm.age.trim()) errors.age = 'Age is required';
    if (!profileForm.county.trim()) errors.county = 'County is required';
    
    // Education & Career
    if (!profileForm.degree.trim()) errors.degree = 'Degree/Qualification is required';
    if (!profileForm.educationLevel.trim()) errors.educationLevel = 'Education level is required';
    if (!profileForm.profession.trim()) errors.profession = 'Profession is required';
    
    // LinkedIn is only required for mentors
    if (selectedRole === MENTOR && !profileForm.linkedin.trim()) {
      errors.linkedin = 'LinkedIn profile is required for mentors';
    }
    
    // Skills & Interests
    if (profileForm.skills.length === 0) errors.skills = 'At least one skill is required';
    if (profileForm.industries.length === 0) errors.industries = 'At least one industry is required';
    if (profileForm.hobbies.length === 0) errors.hobbies = 'At least one hobby is required';
    
    // Additional Information
    if (!profileForm.ethnicity.trim()) errors.ethnicity = 'Ethnicity is required';
    if (!profileForm.religion.trim()) errors.religion = 'Religion is required';
    
    // Past Professions (only required for mentors)
    if (selectedRole === MENTOR) {
      const nonEmptyPastProfessions = profileForm.pastProfessions.filter(p => p.trim());
      if (nonEmptyPastProfessions.length === 0) {
        errors.pastProfessions = 'At least one past profession is required for mentors';
      }
    }
    
    // Looking For (for mentees)
    if (selectedRole === MENTEE && profileForm.lookingFor.length === 0) {
      errors.lookingFor = 'At least one learning goal is required';
    }
    
    return errors;
  };

  const resetForm = () => {
    setProfileForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: '',
      degree: '',
      educationLevel: '',
      county: '',
      profession: '',
      pastProfessions: [''],
      linkedin: '',
      calCom: '',
      hobbies: [],
      ethnicity: '',
      religion: '',
      skills: [],
      lookingFor: [],
      industries: [],
    });
    setValidationErrors({});
  };

  const setFormData = (data: Partial<ProfileFormData>) => {
    setProfileForm(prev => ({ ...prev, ...data }));
  };

  return {
    profileForm,
    validationErrors,
    setValidationErrors,
    handleFormChange,
    handleArrayChange,
    handlePastProfessionChange,
    addPastProfession,
    removePastProfession,
    calculateFormProgress,
    getMissingFields,
    getSectionStatus,
    validateProfileForm,
    resetForm,
    setFormData
  };
};
