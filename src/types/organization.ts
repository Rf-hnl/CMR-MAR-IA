export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  settings: {
    allowMemberInvites: boolean;
    defaultLeadStage: string;
    timezone: string;
  };
}

export interface OrganizationMember {
  userId: string;
  email: string;
  displayName?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastActive?: string;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface UserOrganization {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}