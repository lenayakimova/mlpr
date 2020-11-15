document.addEventListener('click', (ev) => ev.target.tagName === 'A' && !ev.target.href && ev.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.select').forEach(select => new MySelect(select));

  document.querySelectorAll('.filter-group').forEach(group => {
    group.querySelector('.filter-group__header').onclick =
      () => group.classList.toggle('expanded');
  });
  document.querySelector('.scroll-top').onclick = scrollToTop;


  let formTimer;
  const filtersBlock = document.querySelector('.filter__filters');
  filtersBlock.addEventListener('click', ({ target }) => {
    if (target.classList.contains('close')) target.parentElement.remove();
    if (!formTimer) formTimer = setTimeout(sendForm, 50);
  });
  document.querySelector('.filter__clear').onclick = () => {
    if (!formTimer) formTimer = setTimeout(sendForm, 50);
    filtersBlock.querySelectorAll('.close').forEach(el => el.click());
  }

  // document.querySelector('[data-filter="metal"] .filter-group__header').click();

  document.querySelectorAll('[data-filter]').forEach(item => {
    const updateFilter = (value, ...args) => updateFilters(item.dataset.filter,
      [`${item.querySelector('.filter-group__label').textContent}: `, value], ...args);
    filters[item.dataset.method](item, updateFilter, deleteFilter, updateFilters);
  });


  function updateFilters(name, value, isSingle, needElement) {
    if (isSingle) {
      const block = filtersBlock.querySelector(`[data-type="${name}"]`);
      if (block) block.remove();
    }
    value = Array.isArray(value) ? value : [,value];
    filtersBlock.insertAdjacentHTML('beforeEnd', `
      <div class="filter__filters-item" data-type="${name}">
        <span>${value.join('')}</span>
        <i class="close"></i>
        <input name="${name}" value="${value[1]}" hidden>
      </div>
    `);
    sendForm();

    const item = filtersBlock.lastElementChild;
    if (needElement) return item;
    return cb => item.querySelector('.close').onclick = cb;
  }

  function deleteFilter(type) {
    const block = filtersBlock.querySelector(`[data-type="${type}"]`);
    if (block) block.remove();
    if (!formTimer) formTimer = setTimeout(sendForm, 50);
  }

  function sendForm() {
    formTimer = null;
    fetch('https://site.ru/products.php', {
      method: 'POST',
      body: new FormData(filtersBlock)
    })
      .then(res => res.text())
      .catch(err => {
        console.error(err);
        return '<h3 class="products__error">Произошла ошибка при получении данных с сервера</h3>';
      })
      .then(res => document.querySelector('.products__list').innerHTML = res);
  }
});


const filters = {
  category(categoryFilter, updateFilter, deleteFilter) {
    const root = categoryFilter.querySelector('.filter-group__list');
    const back = categoryFilter.querySelector('.filter-group__back');
    let last;

    categoryFilter.addEventListener('click', ({ target }) => {
      if (target.closest('.filter-group__back')) return changeSelected(last.parentElement);

      const list = target.closest('.filter-group__row');
      if (list) changeSelected(list.parentElement);
    });

    function changeSelected(newSelected) {
      last = newSelected;
      categoryFilter.querySelector('.selected').classList.remove('selected');
      newSelected.classList.add('selected');
      if (newSelected === root) {
        back.classList.remove('show');
        deleteFilter('category');
      } else {
        back.classList.add('show');
        back.querySelector('[data-value]').innerText = getNameOfList(newSelected.parentElement);
        updateFilter(getNameOfList(newSelected), true)(() => changeSelected(root));
      }
    }
    function getNameOfList(list) {
      return list.firstElementChild.firstElementChild.innerText;
    }
  },

  price(priceFilter, updateFilter, deleteFilter, updateFilters) {
    const clearRadios = () => priceFilter.querySelectorAll('[name="price"]')
      .forEach(radio => radio.checked = false);

    priceFilter.querySelectorAll('[name="price"]').forEach(radio => {
      radio.onclick = () => updatePrice(radio.previousSibling.textContent);
    });
    priceFilter.querySelector('[data-role="add"]').onclick = () => {
      const newPrice = [...priceFilter.querySelectorAll('[type="text"]')]
        .map(inp => inp.value + ' RUB').join(' - ');
      clearRadios();
      updatePrice(newPrice);
    }

    priceFilter.querySelector('[name="discount"]').onclick = function() {
      if (!this.checked) return deleteFilter(this.name);
      updateFilters(this.name, 'Продается со скидкой')(() => this.checked = false);
    }

    function updatePrice(newPrice) {
      priceFilter.querySelectorAll('[type="text"]').forEach(inp => inp.value = '');
      updateFilter(newPrice.replace(/,/g, ''), true)(clearRadios);
    }
  },

  withMore(filter, updateFilter) {
    (filter.querySelector('.filter-group__more') || {}).onclick = () =>
      filter.querySelector('.filter-group__body').classList.toggle('expanded');

    this._registerCheckboxes(filter, updateFilter);
  },

  withSearch(filter, updateFilter) {
    this._registerCheckboxes(filter, updateFilter);
    const clearHiddens = () => hiddens.querySelectorAll('.filter-group__row')
      .forEach(row => row.classList.remove('show'));
    const search = filter.querySelector('[data-role="search"]');
    const hiddens = filter.querySelector('.filter-group__hiddens');

    search.oninput = function() {
      if (this.value.length < 3) return clearHiddens();
      hiddens.querySelectorAll('.filter-group__row').forEach(row => {
        const isMatched = row.firstElementChild.innerText.match(new RegExp(this.value, 'i'));
        row.classList[isMatched ? 'add' : 'remove']('show');
      });
    }

    hiddens.onclick = ({ target }) => {
      search.value = '';
      clearHiddens();
      const row = target.closest('.filter-group__row');
      const visibleRows = filter.querySelectorAll('.filter-group__body > .filter-group__row');
      if (visibleRows.length) {
        const lastRow = visibleRows[visibleRows.length - 1];
        lastRow.replaceWith(row);
        hiddens.append(lastRow);
      } else {
        search.parentElement.before(row);
      }
    }
  },

  _registerCheckboxes(filter, updateFilter) {
    filter.querySelectorAll('[type="checkbox"]').forEach(checkbox => {
      let elem;
      checkbox.onclick = () => {
        if (!checkbox.checked) elem.remove();
        else {
          elem = updateFilter(checkbox.previousSibling.textContent, false, true);
          elem.querySelector('.close').onclick = () => checkbox.checked = false;
        }
      }
    });
  }
};



window.onscroll = () => document.body.classList[pageYOffset ? 'add' : 'remove']('scroll');
function scrollToTop() {
  if (window.pageYOffset > 0) {
    window.scrollBy(0, -10);
    setTimeout(scrollToTop, 0);
  }
}