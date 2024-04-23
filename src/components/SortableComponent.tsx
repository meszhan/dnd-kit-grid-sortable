import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS, Transform} from '@dnd-kit/utilities';

export const SortableComponent = ({componentId, children}: {componentId: string; children: React.ReactNode}) => {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: componentId});

    const style = {
        transform: CSS.Transform.toString({...transform, scaleX: 1, scaleY: 1} as Transform),
        transition,
        width: '100%',
        height: '100%'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};
