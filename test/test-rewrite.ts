class A {
  foo = 'bar';
  foo1 = 'baz';
  someMethod(param: string) {
    console.log(this.foo, param);
  }
}
class B extends A {
  foo = 'bar B';
  foo1 = 'baz B';
}

const theMethod = A.prototype.someMethod;
A.prototype.someMethod = function (this: A, param: string) {
  console.log(this.foo1, param);
};

const a = new A();
a.someMethod('hi');

const b = new B();
b.someMethod('hey');
