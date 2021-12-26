import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import BlazeDetails from "../../ui/details";
import BlazeList from "../../ui/list";
import BlazeText from "../../ui/text";
import World, { EntityListener } from "../../world";
import EditorPane from "./pane";

export default class WorldPane extends EditorPane {
  world: World;

  content = document.createElement("div");
  entitiesContainer: BlazeDetails;
  entitiesList = new BlazeList();

  /**
   * Creates a {@link WorldPane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos?: vec2, width?: number, height?: number) {
    super("world", pos, width, height);

    this.content.style.display = "flex";
    this.content.style.flexDirection = "column";
    this.content.style.padding = "0.8rem";
    this.element.appendChild(this.content);

    this.entitiesList.element.style.maxHeight = "40vh";
    this.entitiesContainer = new BlazeDetails("Entities", this.entitiesList.element, 1.5);
    this.content.appendChild(this.entitiesContainer.element);
  }

  /**
   * Update world stats.
   */
  update() {
    if (this.world !== Blaze.getScene().world) {
      if (this.world) {
        this.world.removeEntityListener(this.addEntity);
        this.world.removeEntityListener(this.removeEntity);
      }

      this.entitiesList.clearItems();

      this.world = Blaze.getScene().world;
      this.world.addEntityListener(this.addEntity);
      this.world.addEntityListener(this.removeEntity);

      const entities = this.world.getEntities();
      for (let i = 0; i < entities.length; i++) {
        this.addEntity("add", entities[i], i, entities);
      }
    }
  }

  private addEntity: EntityListener = (event, entity) => {
    if (event === "remove") return;

    const text = new BlazeText(`${entity.name || "Entity"} ${this.entitiesList.items.length + 1}`, 1);
    text.element.style.marginBottom = "0.4rem";

    this.entitiesList.addItems(text);
  };

  private removeEntity: EntityListener = (event, entity, index) => {
    if (event === "add") return;

    this.entitiesList.removeItem(index);
  };
}
