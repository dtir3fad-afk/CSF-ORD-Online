import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  query, 
  orderBy, 
  limit,
  where,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { CSFResponse, CSFTemplate, EmailNotification } from '@/types';

const CSF_RESPONSES_COLLECTION = 'csf_responses';
const CSF_TEMPLATES_COLLECTION = 'csf_templates';
const EMAIL_NOTIFICATIONS_COLLECTION = 'email_notifications';

// Helper function to get database instance
function getDb() {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized. Make sure you are running this on the client side.');
  }
  return db;
}

// CSF Templates
export const createCSFTemplate = async (template: Omit<CSFTemplate, 'id'>) => {
  try {
    const docRef = await addDoc(collection(getDb(), CSF_TEMPLATES_COLLECTION), {
      ...template,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating CSF template:', error);
    throw error;
  }
};

export const getCSFTemplates = async () => {
  try {
    const q = query(collection(getDb(), CSF_TEMPLATES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CSFTemplate[];
  } catch (error) {
    console.error('Error getting CSF templates:', error);
    throw error;
  }
};

export const getCSFTemplate = async (id: string) => {
  try {
    const docRef = doc(getDb(), CSF_TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CSFTemplate;
    } else {
      throw new Error('CSF template not found');
    }
  } catch (error) {
    console.error('Error getting CSF template:', error);
    throw error;
  }
};

export const updateCSFTemplate = async (id: string, updates: Partial<CSFTemplate>) => {
  try {
    const docRef = doc(getDb(), CSF_TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating CSF template:', error);
    throw error;
  }
};

export const deleteCSFTemplate = async (id: string) => {
  try {
    const docRef = doc(getDb(), CSF_TEMPLATES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting CSF template:', error);
    throw error;
  }
};

// CSF Responses
export const addCSFResponse = async (response: Omit<CSFResponse, 'id'>) => {
  try {
    const docRef = await addDoc(collection(getDb(), CSF_RESPONSES_COLLECTION), {
      ...response,
      createdAt: Timestamp.now(),
    });
    
    // Update notification status if exists
    await updateNotificationStatus(response.csfId, response.email, docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding CSF response:', error);
    throw error;
  }
};

export const getCSFResponses = async (csfId?: string, limitCount?: number) => {
  try {
    let q = query(collection(getDb(), CSF_RESPONSES_COLLECTION), orderBy('createdAt', 'desc'));
    
    if (csfId) {
      q = query(collection(getDb(), CSF_RESPONSES_COLLECTION), where('csfId', '==', csfId), orderBy('createdAt', 'desc'));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CSFResponse[];
  } catch (error) {
    console.error('Error getting CSF responses:', error);
    throw error;
  }
};

export const getCSFResponsesByTemplate = async (csfId: string) => {
  try {
    const q = query(
      collection(getDb(), CSF_RESPONSES_COLLECTION),
      where('csfId', '==', csfId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CSFResponse[];
  } catch (error) {
    console.error('Error getting CSF responses by template:', error);
    throw error;
  }
};

// Delete CSF Response
export const deleteCSFResponse = async (responseId: string) => {
  try {
    const docRef = doc(getDb(), CSF_RESPONSES_COLLECTION, responseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting CSF response:', error);
    throw error;
  }
};

// Email Notifications
export const createEmailNotification = async (notification: Omit<EmailNotification, 'id'>) => {
  try {
    const docRef = await addDoc(collection(getDb(), EMAIL_NOTIFICATIONS_COLLECTION), {
      ...notification,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating email notification:', error);
    throw error;
  }
};

export const getEmailNotifications = async (csfId?: string) => {
  try {
    let q = query(collection(getDb(), EMAIL_NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    
    if (csfId) {
      q = query(collection(getDb(), EMAIL_NOTIFICATIONS_COLLECTION), where('csfId', '==', csfId), orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailNotification[];
  } catch (error) {
    console.error('Error getting email notifications:', error);
    throw error;
  }
};

export const updateNotificationStatus = async (csfId: string, email: string, responseId?: string) => {
  try {
    const q = query(
      collection(getDb(), EMAIL_NOTIFICATIONS_COLLECTION),
      where('csfId', '==', csfId),
      where('recipientEmail', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const notificationDoc = querySnapshot.docs[0];
      await updateDoc(notificationDoc.ref, {
        responseReceived: true,
        responseId: responseId,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error updating notification status:', error);
    throw error;
  }
};

// Dashboard Analytics
export const getDashboardMetrics = async () => {
  try {
    const [templates, responses] = await Promise.all([
      getCSFTemplates(),
      getCSFResponses()
    ]);

    const activeTemplates = templates.filter(t => t.isActive);
    const completedResponses = responses.filter(r => r.status === 'completed');
    
    let avgRating = 0;
    let satisfactionRate = 0;
    
    if (completedResponses.length > 0) {
      const avgRatings = completedResponses.map(r => {
        if (!r.ratings || typeof r.ratings !== 'object') return 0;
        const vals = Object.values(r.ratings).filter(v => typeof v === 'number' && v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }).filter(avg => avg > 0);
      
      if (avgRatings.length > 0) {
        const globalAvg = avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length;
        avgRating = globalAvg; // Use direct average since 5=Strongly Agree, 1=Strongly Disagree
        
        const satisfiedCount = completedResponses.filter(r => {
          if (!r.ratings || typeof r.ratings !== 'object') return false;
          const vals = Object.values(r.ratings).filter(v => typeof v === 'number' && v > 0);
          if (vals.length === 0) return false;
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          return avg >= 4; // 4-5 are satisfied (Agree + Strongly Agree)
        }).length;
        
        satisfactionRate = Math.round((satisfiedCount / completedResponses.length) * 100);
      }
    }

    return {
      totalCSFs: activeTemplates.length,
      totalResponses: completedResponses.length,
      avgRating,
      satisfactionRate,
      pendingResponses: responses.filter(r => r.status === 'pending').length,
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw error;
  }
};