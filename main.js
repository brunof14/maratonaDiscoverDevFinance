const Modal = {
    refModal: document.querySelector('.modal-overlay'),
    open() {
        this.refModal.classList.add('active')
    },
    close() {
        this.refModal.classList.remove('active')
    }
}

const ApresentationFormat = {
    money(number = 0) {
        if (typeof number !== 'number')
            return 0

        return number.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
    },
    date(dateString) {
        return new Date(dateString).toLocaleDateString('pt-br')
    }

}

const DataTable = {
    refTable: document.querySelector('#data-table tbody'),
    insertTransaction({ id, description, amount, date }) {
        const classOfAmount = amount > 0 ? 'income' : 'expense'

        const amountFormated = ApresentationFormat.money(amount)
        const dateFormated = ApresentationFormat.date(date)

        const template = `<tr>
            <td class="description">${description}</td>
            <td class="${classOfAmount}">${amountFormated}</td>
            <td class="data">${dateFormated}</td>
            <td>
                <img 
                    class="remove" 
                    src="./assets/minus.svg" 
                    alt="Remover Transação"
                    onclick="FormTransaction.delete('${id}')" 
                />
            </td>
        </tr>`;

        this.refTable.innerHTML += template
    },
    load(transactions) {
        this.clear()
        transactions.forEach(transaction => this.insertTransaction(transaction))
    },
    clear() {
        this.refTable.innerHTML = ''
    },
}

const getEntryMoney = (acc, next) => next > 0 ? (acc + next) : acc
const getOutMoney = (acc, next) => next < 0 ? (acc + next) : acc
const getBalance = (acc, next) => acc + next

const generalBalance = (transactions, fnCalculate) =>
    transactions.reduce(fnCalculate, 0)

const Balance = {
    refEntry: document.querySelector('#entry'),
    refOut: document.querySelector('#out'),
    refBalance: document.querySelector('#balance'),

    updateHelper(transactions, fnCalculate, refElementHTML) {
        const value = generalBalance(transactions, fnCalculate)
        refElementHTML.innerHTML = ApresentationFormat.money(value)
    },

    update(transactionsAmount) {
        this.updateHelper(transactionsAmount, getEntryMoney, this.refEntry)
        this.updateHelper(transactionsAmount, getOutMoney, this.refOut)
        this.updateHelper(transactionsAmount, getBalance, this.refBalance)
    }
}

const LocalStorage = {
    get(key) {
        const valueLocal = localStorage.getItem(key)
        if (!valueLocal)
            return

        return JSON.parse(valueLocal)
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    }
}

const Transaction = {
    get transactions() {
        const allTransactions = LocalStorage.get('transactions')
        return allTransactions ? allTransactions : []
    },
    set transactions(value) {
        LocalStorage.set('transactions', value)
    },
    save(description, amount, date) {
        const newTransaction = {
            id: uuidv4(),
            description,
            amount,
            date
        }

        this.transactions = [...this.transactions, newTransaction]
        return newTransaction
    },
    delete(id) {
        this.transactions = this.transactions.filter((transaction) => transaction.id !== id)
    },
    getAll() {
        return this.transactions
    },
    getAllAmount() {
        return this.transactions.map(transaction => transaction.amount)
    }
}

const FormTransaction = {
    refForm: document.querySelector('form'),
    refDescription: document.querySelector('#description'),
    refAmount: document.querySelector('#amount'),
    refDate: document.querySelector('#date'),

    clear() {
        this.refDescription.value = ''
        this.refAmount.value = ''
        this.refDate.value = ''
    },

    save() {
        if (!this.refForm.checkValidity())
            return

        const description = this.refDescription.value
        const amount = Number(this.refAmount.value)
        const date = this.refDate.value

        const transaction = Transaction.save(description, amount, date)

        DataTable.insertTransaction(transaction)
        Balance.update(Transaction.getAllAmount())
        Modal.close()
    },
    delete(id) {
        Transaction.delete(id)
        updateDates()
    }
}

const Loading = {
    refLoading: document.querySelector('.loading-container'),
    show() {
        this.refLoading.classList.remove('hidden')
        this.refLoading.classList.remove('fade-out')
    },
    _fadeOut() {
        this.refLoading.classList.add('fade-out')
    },
    hidden() {
        this._fadeOut()
        this.refLoading.addEventListener('animationend', () => {
            this.refLoading.classList.add('hidden')
        })
    }
}

const ThemeMode = {
    refToggleTheme: document.querySelector('.toggle-theme'),
    get currentTheme() {
        const theme = LocalStorage.get('currentTheme')

        return theme ? theme : 'light'
    },
    set currentTheme(newTheme) {
        LocalStorage.set('currentTheme', newTheme)
    },
    load() {
        this.refToggleTheme.addEventListener('click', () => ThemeMode.toggle())

        if (this.currentTheme === 'dark') {
            this.refToggleTheme.classList.remove('light')
            this.refToggleTheme.classList.add('dark')
            this._toggleTheme()
        }
    },
    toggle() {
        const modes = {
            'light': 'dark',
            'dark': 'light'
        }

        this.refToggleTheme.classList.remove(this.currentTheme)
        this.currentTheme = modes[this.currentTheme]
        this.refToggleTheme.classList.add(this.currentTheme)
        
        this._toggleTheme()
    },

    _toggleTheme() {
        document.documentElement.setAttribute("data-theme", this.currentTheme);
    }
}

const updateDates = () => {
    DataTable.load(Transaction.getAll())
    Balance.update(Transaction.getAllAmount())
}

const initSteps = () => {
    ThemeMode.load()
    updateDates()
    FormTransaction.refForm.onsubmit = (e) => {
        e.preventDefault()
        FormTransaction.clear()
    }
    Loading.hidden()
}
window.onload = initSteps

