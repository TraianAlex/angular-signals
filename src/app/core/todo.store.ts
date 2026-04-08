import {
  signalStore,
  withComputed,
  withState,
  withMethods,
  patchState,
  withHooks,
  signalStoreFeature,
} from '@ngrx/signals';

interface Book {
  id: string;
  title: string;
  price: number;
}

interface BookState {
  books: Book[];
  pencils: string[];
}

function withStateFeature() {
  return signalStoreFeature(
    withState({ myFeature: 'Hello' }),
    withComputed(({ myFeature }) => ({
      plus: () => myFeature() + ' World',
    })),
  );
}

export const BookStore = signalStore(
  { providedIn: 'root' },
  withState<BookState>({ books: [], pencils: [] }),
  withComputed(({ books }) => ({
    totalBooks: () => books().length,
    freeBooks: () => books().filter((book) => book.price === 0),
  })),
  withStateFeature(),
  withMethods((store) => ({
    addBook: (book: Book) => {
      console.log('addBook', store.myFeature());
      patchState(store, { books: [...store.books(), book] });
    },
  })),
  withHooks({
    onInit(store) {
      console.log('BookStore initialized', store.books());
    },
  }),
);
