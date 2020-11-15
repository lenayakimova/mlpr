class MySelect {
	constructor(select) {
		const options = [...select.children];
		this.items = options.map(opt => ({
			value: opt.value,
			text: opt.textContent,
			origin: opt
		}));
		this.multiple = select.multiple;
		const defaultInd = options.findIndex(opt => opt.selected);
		this.defaultValue = this.items[~defaultInd ? defaultInd : 0];

		this.container = document.createElement('div');
		const width = parseInt(select.getAttribute('width')) || 173;
		this.container.style.width = width + 'px';
		this.container.className = 'select';
		select.after(this.container);
		select.hidden = true;

		this.container.insertAdjacentHTML('afterBegin', `
			<div class=" select__title" data-value=${this.defaultValue.value}>${this.multiple ?
				select.getAttribute('placeholder') || 'Выберите элементы' :
				this.defaultValue.text
			}</div>
			<span class="reset" style="left: ${width - 43 + 'px'}"></span>
			<div class="select__content__wrapper"
				${select.size ? `style="max-height: ${40 * select.size + 'px'}"` : ''}>
				<div class="select__content">
					${this.items.map(({ value, text }) => `
						<label class="select__label" data-value="${value}">${text}</label>
					`).join('\n')}
				</div>
			</div>
		`);
		this.title = this.container.querySelector('.select__title');
		this._attachListeners();
	}
	onchange = () => { };

	reset() {
		if (this.multiple) this._onchange([]);
		else this._callOnchangeIfNeed(this.defaultValue);
	}

	get value() {
		return this.multiple ? this._getValues() :
			this.items.find(el => el.value === this.title.dataset.value);
	}

	set value(newValues) {
		newValues = (Array.isArray(newValues) ? newValues : [newValues]).map(el => el.value);
		this.items.forEach((item, i) => {
			const isSelected = ~newValues.indexOf(item.value);
			this.container.querySelector(`.select__label:nth-child(${i + 1})`).dataset.selected =
				isSelected ? 'selected' : '';
			item.origin.selected = isSelected;
		});
	}

	_onchange(value) {
		this.value = value;
		this.onchange(value);
	}

	_getValues() {
		return [...this.container.querySelectorAll('.select__label')]
			.flatMap((el, i) => el.dataset.selected === 'selected' ? [this.items[i]] : []);
	}

	_callOnchangeIfNeed(newValue) {
		if (this.title.dataset.value !== newValue.value) {
			this._onchange(newValue);
			this.title.dataset.value = newValue.value;
			this.title.textContent = newValue.text;
		}
	}

	_attachListeners() {
		let isMyClick;
		document.body.addEventListener('click', () => {
			if (isMyClick) isMyClick = false;
			else this.container.setAttribute('data-state', '');
		});
		this.container.onclick = ({ target }) => {
			isMyClick = true;
			if (target.classList.contains('select__title')) {
				const newVal = !this.container.getAttribute('data-state') ? 'active' : '';
				this.container.setAttribute('data-state', newVal);
			} else if (target.classList.contains('select__label')) {
				if (this.multiple) {
					target.dataset.selected = target.dataset.selected ? '' : 'selected';
					return setTimeout(() => this._onchange(this._getValues()));
				}
				this._callOnchangeIfNeed(this.items.find(el => el.value === target.dataset.value));
				this.container.setAttribute('data-state', '');
			} else if (target.classList.contains('reset')) this.reset();
		}
	}
}