import { auth, db } from '@/firebase';
import type { Workout } from '@/stores/workoutCreator';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where, type Unsubscribe } from 'firebase/firestore';

export interface Friendship {
  id: string;
  participants: string[];
  requester: string;
  recipient: string;
  status: 'pending' | 'accepted';
}
export interface SharedWorkout {
  id: string;
  from: string;
  workout: Workout;
  sharedAt: string;
}

const uid = () => {
  const id = auth.currentUser?.uid;
  if (!id) throw new Error('Authentication required');
  return id;
};
const pairId = (a: string, b: string) => [a, b].sort().join('_');
const friendshipRef = (a: string, b: string) => doc(db, 'friendships', pairId(a, b));

export async function findPublicProfile(userId: string): Promise<string | null> {
  const snapshot = await getDoc(doc(db, 'publicProfiles', userId));
  return snapshot.exists() ? String(snapshot.data().displayName || userId) : null;
}

export async function requestFriend(userId: string) {
  const me = uid();
  if (userId === me) throw new Error('self');
  if (!(await findPublicProfile(userId))) throw new Error('unknown');
  const reference = friendshipRef(me, userId);
  await setDoc(reference, { participants: [me, userId].sort(), requester: me, recipient: userId, status: 'pending' });
}
export async function acceptFriend(friend: Friendship) {
  if (friend.recipient !== uid()) throw new Error('Not allowed');
  await updateDoc(doc(db, 'friendships', friend.id), { status: 'accepted' });
}
export async function removeFriend(friend: Friendship) {
  if (!friend.participants.includes(uid())) throw new Error('Not allowed');
  await deleteDoc(doc(db, 'friendships', friend.id));
}
export function listenFriendships(callback: (friends: Friendship[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'friendships'), where('participants', 'array-contains', uid())),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Friendship)), onError);
}
export function listenSharedWorkouts(callback: (items: SharedWorkout[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid(), 'sharedWorkouts'),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as SharedWorkout)), onError);
}
export async function shareWorkout(friend: Friendship, workout: Workout) {
  const me = uid();
  if (friend.status !== 'accepted') throw new Error('Not friends');
  const recipient = friend.participants.find((id) => id !== me);
  if (!recipient) throw new Error('Invalid friend');
  await setDoc(doc(collection(db, 'users', recipient, 'sharedWorkouts')), {
    from: me, workout: JSON.parse(JSON.stringify(workout)), sharedAt: new Date().toISOString(),
  });
}
export async function dismissSharedWorkout(id: string) {
  await deleteDoc(doc(db, 'users', uid(), 'sharedWorkouts', id));
}
