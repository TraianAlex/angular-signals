declare module 'alertifyjs' {
  interface AlertifyStatic {
    set(name: 'notifier', key: 'position', value: string): AlertifyStatic;
    set(name: 'notifier', key: 'delay', value: number): AlertifyStatic;
    success(message: string, wait?: number, callback?: () => void): AlertifyStatic;
    error(message: string, wait?: number, callback?: () => void): AlertifyStatic;
  }

  const alertify: AlertifyStatic;
  export = alertify;
}
