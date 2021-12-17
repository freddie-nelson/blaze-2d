import { vec2 } from "gl-matrix";
import BlazeTabBar from "../../ui/tabBar";
import EditorPane from "./pane";

export default class EditorPaneGroup extends EditorPane {
  titlebar: BlazeTabBar;
  protected panes: EditorPane[] = [];
  protected currentPane: EditorPane;

  /**
   * Creates an {@link EditorPaneGroup}.
   *
   * @param id The group's ID (must be a valid HTML id)
   * @param pos The top left corner of the group in the editor grid
   * @param width The width of the group in columns
   * @param height The height of the group in rows
   */
  constructor(id: string, pos: vec2, width: number, height: number) {
    super(id, pos, width, height);
  }

  /**
   * Updates all pane's in the group.
   */
  update() {
    this.panes.forEach((p) => p.update());
  }

  /**
   * Refresh the groups ui.
   */
  refresh() {
    if (!this.currentPane) this.currentPane = this.panes[0];

    const currentIndex = this.panes.findIndex((p) => p === this.currentPane);
    if (currentIndex === -1) return;

    this.addTitlebar();
    this.titlebar.markActive(this.currentPane.id, false);

    this.addCurrentPane();
  }

  /**
   * Add the current pane's element to the dom.
   */
  addCurrentPane() {
    this.removeCurrentPane();

    this.currentPane.removeTitlebar();
    this.element.appendChild(this.currentPane.element);
  }

  /**
   * Remove the current pane's element from the dom.
   */
  removeCurrentPane() {
    if (!this.currentPane) return;

    this.currentPane.element.remove();
  }

  /**
   * Show the pane with the given id.
   *
   * @param id The id of the pane
   */
  showPane(id: string): void;

  /**
   * Change the current pane to the one given.
   *
   * @param pane The pane to show
   */
  showPane(pane: EditorPane): void;

  showPane(pane: EditorPane | string) {
    this.removeCurrentPane();

    if (typeof pane === "string") {
      this.currentPane = this.panes.find((p) => p.id === pane);
    } else {
      this.currentPane = this.panes.find((p) => p === pane);
    }

    this.refresh();
  }

  /**
   * Adds a pane to the group.
   *
   * @param pane The pane to add
   */
  addPane(pane: EditorPane) {
    this.panes.push(pane);
    this.refresh();
  }

  /**
   * Removes a pane from the group.
   *
   * @param pane The pane to remove
   */
  removePane(pane: EditorPane) {
    const index = this.panes.findIndex((p) => p === pane);
    if (index === -1) return false;

    this.panes.splice(index, 1);
    if (pane === this.currentPane) this.currentPane = undefined;

    this.refresh();
    return true;
  }

  override addTitlebar() {
    this.removeTitlebar();
    if (!this.panes) this.panes = [];

    this.titlebar = new BlazeTabBar(...this.panes.map((p) => p.id));
    this.element.appendChild(this.titlebar.element);

    this.titlebar.activeCb = (tab) => this.showPane(tab);
  }
}
