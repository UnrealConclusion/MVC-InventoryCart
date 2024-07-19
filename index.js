const API = (() => {
  const URL = "http://localhost:3000";

  // fetch all items in cart from database 
  const getCart = () => {
    return fetch(`${URL}/cart`)
      .then(res => res.json());
  };

  // fetch all items in inventory from database
  const getInventory = () => {
    return fetch(`${URL}/inventory`)
      .then(res => res.json());
  };

  // post new item to cart array 
  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({quantity: newAmount})
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    // setter for cart
    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    // setter for inventory
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    // set callback function for when state changes
    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout
  };
})();

const View = (() => {
  const inventoryListEl = document.querySelector(".inventory-list");
  const cartListEl = document.querySelector(".cart-list");
  const checkoutBtnEL = document.querySelector(".checkout-btn");

  // render method for inventory
  const renderInventory = (inventory) => {
    let newContent = "";
    inventory.forEach(item => {
      newContent += `
        <li id=${item.id}>${item.content} 
          <button class="inventory-minus-btn">-</button> ${item.quantity} <button class="inventory-add-btn">+</button> <button class="inventory-add-to-cart-btn">add to cart</button>
        </li>
      `
    });

    inventoryListEl.innerHTML = newContent;
  }

  // render method for cart
  const renderCart = (cart) => {
    let newContent = "";
    cart.forEach(item => {
      newContent += `
        <li id=${item.id}>${item.content} x ${item.quantity} <button class="cart-delete-btn">delete</button></li>
      `
    });

    cartListEl.innerHTML = newContent;    
  }
  return {
    inventoryListEl,
    cartListEl,
    checkoutBtnEL,
    renderInventory,
    renderCart
  };
})();

const Controller = ((model, view) => {

  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    // setup callback function
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });

    // initialize inventory content to content of the database
    model.getInventory()
      .then(data => {
        data.forEach(item => {
          item.quantity = 0;
        })
        state.inventory = data;
      }
    )

    // initialize cart content to content of the database
    model.getCart()
      .then(date => {
        state.cart = date
      }
    )
  };



  const handleUpdateAmount = (id, newAmount) => {
    model.updateCart(id, newAmount)
      .then(() => model.getCart())
      .then(data => {
        state.cart = data;
      });
  };

  const handleAddToCart = (inventoryItem) => {
    model.addToCart(inventoryItem)
    .then(() => model.getCart())
    .then(data => {
      state.cart = data;
    });
  };

  const handleDelete = (id) => {
    model.deleteFromCart(id)
    .then(() => model.getCart())
    .then(data => {
      state.cart = data;
    });
  };

  const handleCheckout = () => {
    model.checkout()
    .then(() => model.getCart())
    .then(data => {
      state.cart = data;
    });
  };

  view.checkoutBtnEL.addEventListener("click", event => {
    handleCheckout();
  });

  view.cartListEl.addEventListener("click", event => {
    const element = event.target;
    
    if (element.className === "cart-delete-btn"){
      handleDelete(element.parentElement.getAttribute("id"));
    }
  });

  view.inventoryListEl.addEventListener("click", event => {
    const element = event.target;

    if (element.className === "inventory-minus-btn") {
      state.inventory = state.inventory.map(item => {
        if (element.parentElement.getAttribute("id") == item.id && item.quantity > 0) {
          return {
            ...item, 
            quantity: item.quantity - 1
          }
        }
        return item;
      });
    }
    else if (element.className === "inventory-add-btn") {
      state.inventory = state.inventory.map(item => {
        if (element.parentElement.getAttribute("id") == item.id) {
          return {
            ...item, 
            quantity: item.quantity + 1
          }
        }
        return item;
      });
    }
    else if (element.className === "inventory-add-to-cart-btn") {
      const inventoryItem = state.inventory.find(item => element.parentElement.getAttribute("id") == item.id);

      if (inventoryItem.quantity > 0) {
        const cartItem = state.cart.find(item => element.parentElement.getAttribute("id") == item.id);
        if (cartItem !== undefined){
          handleUpdateAmount(cartItem.id, cartItem.quantity + inventoryItem.quantity);
        }
        else {
          handleAddToCart(inventoryItem);
        }
      }
    }
  });


  const bootstrap = () => {
    init();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
