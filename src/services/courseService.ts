import { collection, getDocs, doc, setDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  images?: string[];
  microscopeImage?: string;
  order: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

export async function getCourses(): Promise<Course[]> {
  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    const courses: Course[] = [];

    for (const courseDoc of coursesSnap.docs) {
      const courseData = courseDoc.data() as Omit<Course, 'modules'>;
      const modulesSnap = await getDocs(query(collection(db, `courses/${courseDoc.id}/modules`), orderBy('order')));
      const modules: Module[] = [];

      for (const moduleDoc of modulesSnap.docs) {
        const moduleData = moduleDoc.data() as Omit<Module, 'lessons'>;
        const lessonsSnap = await getDocs(query(collection(db, `courses/${courseDoc.id}/modules/${moduleDoc.id}/lessons`), orderBy('order')));
        const lessons = lessonsSnap.docs.map(d => d.data() as Lesson);
        
        modules.push({
          ...moduleData,
          lessons
        });
      }

      courses.push({
        ...courseData,
        modules
      });
    }

    return courses;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'courses');
    return [];
  }
}

export async function seedDatabase(initialCourses: Course[]) {
  try {
    const batch = writeBatch(db);

    for (const course of initialCourses) {
      const courseRef = doc(db, 'courses', course.id);
      batch.set(courseRef, {
        id: course.id,
        title: course.title,
        description: course.description
      });

      for (const module of course.modules) {
        const moduleRef = doc(db, `courses/${course.id}/modules`, module.id);
        batch.set(moduleRef, {
          id: module.id,
          courseId: course.id,
          title: module.title,
          order: module.order
        });

        for (const lesson of module.lessons) {
          const lessonRef = doc(db, `courses/${course.id}/modules/${module.id}/lessons`, lesson.id);
          batch.set(lessonRef, {
            ...lesson,
            moduleId: module.id
          });
        }
      }
    }

    await batch.commit();
    console.log('Database seeded successfully');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'courses');
  }
}
