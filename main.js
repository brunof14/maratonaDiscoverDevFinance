const Modal = {
    modalOverlay: document.querySelector('.modal-overlay'),
    toggle() {
        Modal.modalOverlay.classList.toggle('active')
    }
}

const Loading = {
    container: document.querySelector('.loading-container'),

    hidden() {
        Loading.container.classList.add('fade-out')
        Loading.container.addEventListener('animationend', () => {
            Loading.container.classList.add('hidden')
        })
    }
}

const StorageTheme = {
    get() {
        return localStorage.getItem('theme') || 'light'
    },
    set(theme) {
        localStorage.setItem('theme', theme)
    }
}

const Theme = {
    current: StorageTheme.get(),
    load() {
        document.documentElement.dataset.theme = Theme.current
    },

    toggle() {
        const newTheme = Theme.current === 'light' ? 'dark' : 'light'

        Theme.current = newTheme
        StorageTheme.set(newTheme)

        Theme.load()
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem('transactions')) || []
    },
    set(transactions){
        localStorage.setItem('transactions', JSON.stringify(transactions))
    }
}

const Transactions = {
    all: Storage.get(),

    add(transaction) {
        Transactions.all.push(transaction)
        App.reload()
    },

    remove(index) {
        Transactions.all.splice(index, 1)
        App.reload()
    },

    incomes() {
        return Transactions.all.reduce((acc, next) => {
            return next.amount > 0 ? acc + next.amount : acc
        }, 0)
    },

    expenses() {
        return Transactions.all.reduce((acc, next) => {
            return next.amount < 0 ? acc + next.amount : acc
        }, 0)
    },

    total() {
        return Transactions.incomes() + Transactions.expenses()
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index

        DOM.transactionsContainer.appendChild(tr)
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.amount < 0 ? 'expense' : 'income'

        const amount = Utils.formatCurrency(transaction.amount)

        const html = `
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class="data">${transaction.date}</td>
            <td>
                <img 
                    class="remove" 
                    src="./assets/minus.svg" 
                    alt="Remover Transação"
                    onclick="Transactions.remove(${index})"
                    
                />
            </td>
        `
        return html
    },

    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transactions.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transactions.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transactions.total())
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ''
    }
}

const Utils = {
    formatCurrency(value) {
        const signal = Number(value) < 0 ? '-' : ''

        value = String(value).replace(/\D/g, '')

        value = Number(value) / 100

        value = value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })

        return signal + value
    },
    formatAmount(value) {
        value = Number(value.replace(/\,\./g, "")) * 100
        return Number(value.toFixed(0))
    },
    formatDate(value) {
        value = String(value)
        return new Date(value)
                        .toLocaleDateString('pt-br', { timeZone: 'UTC' })
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    formatValues() {
        let { description, amount, date } = Form.getValues()

        amount = Utils.formatAmount(amount)

        date = Utils.formatDate(date)
        
        return { description, amount, date }
    },

    validateFields() {
        const { description, amount, date } = Form.getValues()

        if ( description.trim() === '' ||
            amount.trim() === '' ||
            date.trim() === '' ) {
                throw new Error("Por favor, preencha todos os campos")
            }
    },

    saveTransaction(transaction) {
        Transactions.add(transaction)
    },

    clearFields(){
        Form.description.value = ''
        Form.amount.value = ''
        Form.date.value = ''
    },

    submit(event) {
        event.preventDefault()

        try {
            Form.validateFields()
            const transaction = Form.formatValues()
            Transactions.add(transaction)
            Form.clearFields()
            Modal.toggle()
        } catch (error) {
            alert(error.message)
        }

    }
}

const App = {
    init() {
        Transactions.all.forEach(DOM.addTransaction)

        DOM.updateBalance()

        Storage.set(Transactions.all)
    },

    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

window.addEventListener('load', () => {
    Theme.load()
    App.init()
    Loading.hidden()
})