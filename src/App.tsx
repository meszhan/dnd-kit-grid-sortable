import {useEffect, useRef, useState} from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    Modifier,
    MouseSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {SortableContext, arrayMove, SortingStrategy} from '@dnd-kit/sortable';

import {SortableComponent} from './components/SortableComponent';

import {layoutComponent, restrictToBoundingRect} from './utils';

import './App.css';

interface ComponentType {
    /** 组件id */
    componentId: string;
    /** 行数 */
    rowSpan: number;
    /** 列数 */
    colSpan: number;
    /** 网格中的x行 */
    x: number;
    /** 网格中的x列 */
    y: number;
}

const COMPONENT_SIZE = 136;
const COMPONENT_GAP = 16;

const layoutComponents = (components: ComponentType[]) => {
    /** 先建立一个尺寸max的网格布局 */
    const grid = new Array(components.length * 2).fill(1).map(() => new Array(8).fill(0));

    return components.map(component => {
        const [x, y] = layoutComponent(grid, {
            width: component.colSpan,
            height: component.rowSpan
        });

        return {...component, x, y};
    });
};

function App() {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // 区分 click 和 drag 事件，不传时屏蔽 click 事件
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    );
    const gridRef = useRef<HTMLDivElement>(null);
    /** 随机生成9个需要布局的小组件 */
    const [components, setComponents] = useState<ComponentType[]>(
        new Array(9).fill(1).map((_, index) => ({
            componentId: `${index}`,
            rowSpan: Math.round(Math.random()) + 1,
            colSpan: Math.round(Math.random()) + 1,
            x: 0,
            y: 0
        }))
    );
    /** 正在拖拽的组件id */
    const [draggingComponentId, setDraggingComponentId] = useState('');
    /** 网格布局的行数 */
    const [gridRows, setGridRows] = useState(0);

    const onDragStart = (e: DragStartEvent) => {
        setDraggingComponentId(e.active.id as string);
        console.log(draggingComponentId);
    };

    useEffect(() => {
        const newComponents = layoutComponents(components);
        setComponents(newComponents);
        setGridRows(Math.max(...newComponents.map(component => component.x)));
    }, []);

    const onDragEnd = (e: DragEndEvent) => {
        setDraggingComponentId('');
        if (e.over && e.active.id !== e.over.id) {
            const newComponents = layoutComponents(
                arrayMove(
                    components,
                    e.active.data.current?.['sortable'].index,
                    e.over.data.current?.['sortable'].index
                )
            );
            setComponents(newComponents);
            setGridRows(Math.max(...newComponents.map(component => component.x)));
        }
    };

    const sortableStrategy: SortingStrategy = ({activeIndex, overIndex, index}) => {
        const grid = new Array(components.length * 2).fill(1).map(() => new Array(8).fill(0));
        const newComponents = arrayMove(components.slice(0), activeIndex, overIndex).map(component => {
            const [x, y] = layoutComponent(grid, {
                width: component.colSpan,
                height: component.rowSpan
            });

            return {...component, x, y};
        });

        const oldComponent = components[index]!;
        const newComponent = newComponents.find(component => component.componentId === oldComponent.componentId)!;

        return {
            y: (newComponent.x - oldComponent.x) * (COMPONENT_SIZE + COMPONENT_GAP),
            x: (newComponent.y - oldComponent.y) * (COMPONENT_SIZE + COMPONENT_GAP),
            scaleX: 1,
            scaleY: 1
        };
    };

    const gridModifier: Modifier = ({draggingNodeRect, transform}) => {
        if (!draggingNodeRect || !gridRef.current) {
            return transform;
        }

        return restrictToBoundingRect(transform, draggingNodeRect, gridRef.current.getBoundingClientRect());
    };

    return (
        <DndContext sensors={sensors} modifiers={[gridModifier]} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <SortableContext items={components.map(component => component.componentId)} strategy={sortableStrategy}>
                <div
                    ref={gridRef}
                    className="grid-layout"
                    style={{
                        gridTemplateRows: `repeat(${gridRows}, 1fr)`
                    }}
                >
                    {components.map(component => (
                        <div
                            key={component.componentId}
                            style={{
                                gridRow: `${component.x + 1} / ${component.x + component.rowSpan + 1}`,
                                gridColumn: `${component.y + 1} / ${component.y + 1 + component.colSpan}`,
                                width: component.colSpan * COMPONENT_SIZE + (component.colSpan - 1) * COMPONENT_GAP,
                                height: component.rowSpan * COMPONENT_SIZE + (component.rowSpan - 1) * COMPONENT_GAP
                            }}
                        >
                            <SortableComponent componentId={component.componentId}>
                                <div className="component">{component.componentId}</div>
                            </SortableComponent>
                        </div>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default App;
