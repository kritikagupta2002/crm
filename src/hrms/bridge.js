const HR_TEAM = ['Admin', 'HR']

export const hrRoleOf = (role) => (HR_TEAM.includes(role) ? 'hr' : 'employee')
