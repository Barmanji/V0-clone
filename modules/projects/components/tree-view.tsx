import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { TreeItem } from "@/lib/utils";

interface TreeViewProps {
  data: TreeItem[];
  value: string | null;
  onSelect: (path: string) => void;
}

interface TreeProps {
  item: TreeItem;
  selectedValue: string | null;
  onSelect: (path: string) => void;
  parentPath: string;
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  // console.log("TREE DATA:", JSON.stringify(data, null, 2));
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    selectedValue={value}
                    onSelect={onSelect}
                    parentPath=""
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );
};

const Tree = ({ item, selectedValue, onSelect, parentPath }: TreeProps) => {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  const currentPath = parentPath ? `${parentPath}/${name}` : name;
// console.log({
//   item,
//   name,
//   items,
//   parentPath,
//   currentPath,
// });
  if (!items.length) {
    const isSelected = selectedValue === currentPath;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isSelected}
          className="data-active:bg-transparent"
          onClick={() => onSelect?.(currentPath)}
        >
          <FileIcon />
          <span className="truncate">{name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger render={<SidebarMenuButton />}>
          <ChevronRightIcon className="transition-transform" />
          <FolderIcon />
          <span className="truncate">{name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((child, index) => (
              <Tree
                key={index}
                item={child}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
