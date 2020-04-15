class MyDemo extends LitElement {
  static get styles() {
    return css`
      $base-color: #c6538c;
      $border-dark: rgba($base-color, 0.88);

      .alert {
        border: 1px solid $border-dark;
      }

      nav {
        ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
      }
    `;
  }
}
