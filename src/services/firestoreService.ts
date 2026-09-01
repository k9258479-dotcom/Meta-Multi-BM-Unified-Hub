import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { BusinessManager, AdAccount, ASLAlert, UserProfile } from '../types';

export interface StoredUserAccount extends UserProfile {
  passwordHash?: string; // Stored credential hash/string for client authentication
}

// ----------------------------------------------------
// USERS & AUTHENTICATION
// ----------------------------------------------------

const USERS_COLLECTION = 'users';
const BMS_COLLECTION = 'business_managers';
const ACCOUNTS_COLLECTION = 'ad_accounts';
const ALERTS_COLLECTION = 'alerts';

// Initial default admin check
export async function initializeMasterAdminIfNeeded(): Promise<UserProfile> {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const snap = await getDocs(q);
    
    // Default Master Admin with username 'kim' and password '7777'
    const defaultAdmin: StoredUserAccount = {
      id: 'user_master_admin_kim',
      userId: 'user_master_admin_kim',
      username: 'kim',
      email: 'kim@meta-hub.local',
      displayName: 'Kim (Admin)',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash: '7777',
    };

    if (snap.empty) {
      // Seed default Master Admin
      await setDoc(doc(db, USERS_COLLECTION, defaultAdmin.id), defaultAdmin);
      return defaultAdmin;
    }
    
    const users = snap.docs.map(d => d.data() as StoredUserAccount);
    const existingKim = users.find(u => u.username.toLowerCase() === 'kim');
    if (!existingKim) {
      // Ensure kim admin exists in database
      await setDoc(doc(db, USERS_COLLECTION, defaultAdmin.id), defaultAdmin);
      return defaultAdmin;
    }
    
    // Update password to 7777 if needed
    if (existingKim.passwordHash !== '7777') {
      await updateDoc(doc(db, USERS_COLLECTION, existingKim.id), { passwordHash: '7777' });
      existingKim.passwordHash = '7777';
    }

    return existingKim;
  } catch (err) {
    console.error('Error initializing admin:', err);
    // Fallback local admin if offline
    return {
      id: 'user_master_admin_kim',
      userId: 'user_master_admin_kim',
      username: 'kim',
      email: 'kim@meta-hub.local',
      displayName: 'Kim (Admin)',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchAllUsers(): Promise<StoredUserAccount[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map(d => d.data() as StoredUserAccount);
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}

export async function createUserAccount(userData: {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role: 'admin' | 'member';
  createdBy: string;
}): Promise<StoredUserAccount> {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: StoredUserAccount = {
    id: userId,
    userId: userId,
    username: userData.username.trim().toLowerCase(),
    email: userData.email.trim().toLowerCase(),
    displayName: userData.displayName.trim(),
    role: userData.role,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: userData.createdBy,
    passwordHash: userData.password,
  };

  await setDoc(doc(db, USERS_COLLECTION, userId), newUser);
  return newUser;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  // Delete user doc
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
  
  // Delete all user's BMs
  const bmsQuery = query(collection(db, BMS_COLLECTION), where('userId', '==', userId));
  const bmsSnap = await getDocs(bmsQuery);
  for (const docSnap of bmsSnap.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Delete all user's Ad Accounts
  const accQuery = query(collection(db, ACCOUNTS_COLLECTION), where('userId', '==', userId));
  const accSnap = await getDocs(accQuery);
  for (const docSnap of accSnap.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Delete all user's Alerts
  const alertQuery = query(collection(db, ALERTS_COLLECTION), where('userId', '==', userId));
  const alertSnap = await getDocs(alertQuery);
  for (const docSnap of alertSnap.docs) {
    await deleteDoc(docSnap.ref);
  }
}

export async function updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), { status });
}

export async function authenticateUser(usernameOrEmail: string, password: string): Promise<{ success: boolean; user?: StoredUserAccount; error?: string }> {
  try {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const allUsers = snap.docs.map(d => d.data() as StoredUserAccount);

    if (allUsers.length === 0) {
      // Auto-initialize default admin
      const admin = await initializeMasterAdminIfNeeded();
      if ((cleanInput === 'kim' || cleanInput === admin.email?.toLowerCase()) && password === '7777') {
        return { success: true, user: admin as StoredUserAccount };
      }
    }

    const matched = allUsers.find(u => 
      (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) &&
      u.passwordHash === password
    );

    if (!matched) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    if (matched.status === 'suspended') {
      return { success: false, error: 'This user account has been suspended by the administrator.' };
    }

    return { success: true, user: matched };
  } catch (err: any) {
    console.error('Auth error:', err);
    return { success: false, error: err.message || 'Authentication failed.' };
  }
}

// ----------------------------------------------------
// BUSINESS MANAGERS (SCOPED BY USER ID)
// ----------------------------------------------------

export function subscribeUserBusinessManagers(userId: string, callback: (bms: BusinessManager[]) => void) {
  const q = query(collection(db, BMS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as BusinessManager));
    callback(list);
  }, (error) => {
    console.warn('Firestore BMs subscription warning:', error);
  });
}

export async function saveUserBusinessManager(userId: string, bm: BusinessManager): Promise<void> {
  const docId = bm.id || `bm_${Date.now()}`;
  const data = { ...bm, id: docId, userId };
  await setDoc(doc(db, BMS_COLLECTION, docId), data);
}

export async function deleteUserBusinessManager(userId: string, bmId: string): Promise<void> {
  await deleteDoc(doc(db, BMS_COLLECTION, bmId));
  
  // Also delete attached ad accounts
  const accQuery = query(collection(db, ACCOUNTS_COLLECTION), where('userId', '==', userId), where('bmId', '==', bmId));
  const snap = await getDocs(accQuery);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}

// ----------------------------------------------------
// AD ACCOUNTS (SCOPED BY USER ID)
// ----------------------------------------------------

export function subscribeUserAdAccounts(userId: string, callback: (accounts: AdAccount[]) => void) {
  const q = query(collection(db, ACCOUNTS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AdAccount));
    callback(list);
  }, (error) => {
    console.warn('Firestore AdAccounts subscription warning:', error);
  });
}

export async function saveUserAdAccount(userId: string, account: AdAccount): Promise<void> {
  const docId = account.id || `acc_${Date.now()}`;
  const data = { ...account, id: docId, userId };
  await setDoc(doc(db, ACCOUNTS_COLLECTION, docId), data);
}

export async function updateUserAdAccountASL(
  userId: string, 
  accountId: string, 
  updates: Partial<AdAccount>
): Promise<void> {
  await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), updates);
}

export async function deleteUserAdAccount(userId: string, accountId: string): Promise<void> {
  await deleteDoc(doc(db, ACCOUNTS_COLLECTION, accountId));
}

// ----------------------------------------------------
// REAL-TIME ASL ALERTS (SCOPED BY USER ID)
// ----------------------------------------------------

export function subscribeUserAlerts(userId: string, callback: (alerts: ASLAlert[]) => void) {
  const q = query(collection(db, ALERTS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ASLAlert));
    callback(list);
  }, (error) => {
    console.warn('Firestore Alerts subscription warning:', error);
  });
}

export async function saveUserAlert(userId: string, alert: ASLAlert): Promise<void> {
  const docId = alert.id || `alert_${Date.now()}`;
  const data = { ...alert, id: docId, userId };
  await setDoc(doc(db, ALERTS_COLLECTION, docId), data);
}

export async function markUserAlertRead(userId: string, alertId: string): Promise<void> {
  await updateDoc(doc(db, ALERTS_COLLECTION, alertId), { read: true });
}

export async function clearAllUserAlerts(userId: string): Promise<void> {
  const q = query(collection(db, ALERTS_COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}
