export function Name(name: string): ClassDecorator {
	return (Class) => {
		Object.defineProperty(Class, 'name', {
			value: name,
		});
	};
}
