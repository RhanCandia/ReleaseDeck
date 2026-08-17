import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
} from "@decky/ui";
import {
  definePlugin,
} from "@decky/api";
import { FaGithub } from "react-icons/fa";

function Content() {
  return (
    <PanelSection title="ReleaseDeck">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() => {}}
        >
          ReleaseDeck v0.1.0-alpha.1
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  return {
    name: "ReleaseDeck",
    icon: <FaGithub />,
    content: <Content />,
  };
});
