const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/app/admin/agenda/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add constants at the top of the file, after imports
if (!content.includes('const START_HOUR = 8;')) {
  content = content.replace(/(import .*;\n)+/m, (match) => {
    return match + `\nconst START_HOUR = 8;
const END_HOUR = 19;
const PIXELS_PER_MINUTE = 2;
const ROW_HEIGHT = 15 * PIXELS_PER_MINUTE;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE;\n\n`;
  });
}

// 2. Replace timeSlots useMemo
const timeSlotsOld = `  // Gerar horários (8:00 às 19:00 a cada 30 min) - memoizado
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      slots.push(\`\${hour.toString().padStart(2, '0')}:00\`);
      slots.push(\`\${hour.toString().padStart(2, '0')}:30\`);
    }
    return slots;
  }, []);`;

const timeSlotsNew = `  // Gerar horários (a cada 15 min) - memoizado
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(\`\${hour.toString().padStart(2, '0')}:00\`);
      slots.push(\`\${hour.toString().padStart(2, '0')}:15\`);
      slots.push(\`\${hour.toString().padStart(2, '0')}:30\`);
      slots.push(\`\${hour.toString().padStart(2, '0')}:45\`);
    }
    return slots;
  }, []);

  const getTopPosition = useCallback((time: string) => {
    const [hour, min] = time.split(':').map(Number);
    return ((hour - START_HOUR) * 60 + min) * PIXELS_PER_MINUTE;
  }, []);

  const getInitials = useCallback((text: string) => {
    if (!text) return '';
    const parts = text.split(' ').filter(n => n.length > 2 || n === n.toUpperCase());
    if (parts.length === 0) return text.substring(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);`;

if (content.includes('const timeSlots = useMemo(() => {\n    const slots = [];\n    for (let hour = 8; hour < 19; hour++) {\n      slots.push(`${hour.toString().padStart(2, \'0\')}:00`);\n      slots.push(`${hour.toString().padStart(2, \'0\')}:30`);')) {
  // Regex to replace the whole block
  content = content.replace(/\/\/ Gerar horários(.*?)return slots;\n  }, \[\]\];/s, timeSlotsNew);
} else {
  // Try a manual index replacement
  const tsStart = content.indexOf('const timeSlots = useMemo');
  if (tsStart !== -1) {
    const tsEnd = content.indexOf('}, []);', tsStart) + 7;
    content = content.substring(0, tsStart - 4) + timeSlotsNew + content.substring(tsEnd);
  }
}

// 3. Replace the entire rendering block
const renderOldStart = '            {/* Grid de horários */}';
const renderOldEnd = '            </div>\n          </div>\n        </div>\n      </Card>'; // Up to the end of Card

const renderNew = `            {/* Grid de horários e colunas (Substituído para Posicionamento Absoluto) */}
            <div className="relative bg-white" style={{ height: \`\${TOTAL_HEIGHT}px\` }}>
              
              {/* Linhas de grade de fundo (horizontal) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
                {timeSlots.map((time, idx) => (
                  <div 
                    key={\`bg-line-\${time}\`} 
                    className={\`w-full border-b \${time.endsWith(':00') ? 'border-neutral-200 bg-neutral-50/40' : 'border-neutral-100'}\`}
                    style={{ height: \`\${ROW_HEIGHT}px\`, boxSizing: 'border-box' }}
                  />
                ))}
              </div>

              <div className="grid absolute inset-0 z-10" style={{ gridTemplateColumns: \`80px repeat(\${professionals.length}, 1fr)\` }}>
                
                {/* Coluna 1: Rótulos de Tempo */}
                <div className="relative border-r border-neutral-200 bg-white/60 backdrop-blur-sm pointer-events-none">
                  {timeSlots.map((time) => {
                    const isHour = time.endsWith(':00');
                    return (
                      <div 
                        key={\`label-\${time}\`} 
                        className="absolute w-full text-right pr-2 select-none"
                        style={{ top: \`\${getTopPosition(time)}px\`, transform: 'translateY(-50%)' }}
                      >
                        {isHour ? (
                          <span className="text-xs text-neutral-600 font-medium">{time}</span>
                        ) : (
                          <span className="text-[9px] text-neutral-400 font-medium">{time.split(':')[1]}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Colunas dos Profissionais */}
                {professionals.map((prof) => {
                  const profAppointments = appointments.filter(apt => apt.professionalId === prof.id);

                  return (
                    <div 
                      key={\`col-\${prof.id}\`} 
                      className="relative border-r border-neutral-200 last:border-r-0 hover:bg-neutral-50/10 transition-colors"
                      onDragOver={(e) => handleDragOver(e, '00:00', prof.id)} // Simplificado para capturar a coluna
                      onDrop={(e) => {
                        // Calcular tempo baseado no drop Y
                        const defaultTime = dropTarget?.time || '12:00'; 
                        handleDrop(e, defaultTime, prof.id);
                      }}
                    >
                      {profAppointments.map(apt => {
                        const top = getTopPosition(apt.startTime);
                        const rawHeight = apt.duration * PIXELS_PER_MINUTE;
                        const height = Math.max(rawHeight, 24); // Visual Snap
                        const isUltraCompact = apt.duration < 20;

                        const serviceInitials = getInitials(apt.service);
                        const profInitials = getInitials(prof.name);
                        
                        let shortLabel = '';
                        if (isUltraCompact) {
                          const stepPrefix = apt.tem_etapas && apt.etapa_index !== undefined ? \`\${apt.etapa_index + 1}. \` : '';
                          shortLabel = \`\${stepPrefix}\${serviceInitials} (\${profInitials})\`;
                        }

                        // Agrupamento de cliente será visualizado com a mesma cor base
                        const isDragging = draggedAppointmentId === apt.id;

                        return (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              handleDragStart(e, apt.id);
                            }}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (apt.comanda_id) {
                                setSelectedComandaId(apt.comanda_id);
                                setComandaDrawerOpen(true);
                              }
                            }}
                            className={\`absolute left-1 right-1 rounded shadow-sm border overflow-hidden cursor-pointer hover:shadow-md hover:z-30 transition-all duration-200 group \${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}\`}
                            style={{
                              top: \`\${top}px\`,
                              height: \`\${height}px\`,
                              backgroundColor: apt.groupColor ? \`\${apt.groupColor}15\` : '#f3f4f6', 
                              borderColor: apt.groupColor ? \`\${apt.groupColor}40\` : '#e5e7eb',
                              borderLeftWidth: '3px',
                              borderLeftColor: apt.groupColor || '#3b82f6',
                            }}
                            title={\`\${apt.client}\\n\${apt.tem_etapas && apt.etapa_index !== undefined ? \`Etapa \${apt.etapa_index + 1}: \` : ''}\${apt.service}\\n\${apt.startTime} (\${apt.duration}min)\`}
                          >
                            {/* Linha de progresso fake (sempre 100% se for do passado, etc. Simplificando para visual MVP) */}
                            <div 
                              className="absolute bottom-0 left-0 h-[2px] bg-black/10"
                              style={{ width: '0%' }}
                            />

                            <div className={\`flex flex-col h-full \${isUltraCompact ? 'p-[2px] px-1 justify-center' : 'p-1.5'}\`}>
                              {isUltraCompact ? (
                                <div className="flex justify-between items-center h-full">
                                  <span className="text-[10px] font-bold text-neutral-800 truncate leading-none">
                                    {shortLabel}
                                  </span>
                                  {apt.eh_auxiliar && <span className="text-[9px] ml-1">🤝</span>}
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-neutral-800 truncate" title={apt.client}>{apt.client}</span>
                                    <div className={\`w-1.5 h-1.5 rounded-full \${getStatusIndicator(apt.status)} flex-shrink-0 mt-1\`} />
                                  </div>
                                  <span className="text-[10px] text-neutral-600 truncate leading-tight mt-0.5">
                                    {apt.tem_etapas && apt.etapa_index !== undefined ? \`\${apt.etapa_index + 1}. \` : ''}
                                    {apt.service}
                                  </span>
                                  <div className="flex justify-between items-center mt-auto">
                                    <span className="text-[9px] text-neutral-500 font-medium tracking-tight">
                                      {apt.startTime} ({apt.duration}m)
                                    </span>
                                    {apt.eh_auxiliar && <span className="text-[10px]">🤝</span>}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>`;

const startIdx = content.indexOf(renderOldStart);
if (startIdx !== -1) {
  const endIdx = content.indexOf('      </Card>', startIdx);
  if (endIdx !== -1) {
    content = content.substring(0, startIdx) + renderNew + content.substring(endIdx + 13);
  } else {
    console.error('Could not find end of rendering block.');
  }
} else {
  console.error('Could not find start of rendering block.');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully refactored agenda component.');
