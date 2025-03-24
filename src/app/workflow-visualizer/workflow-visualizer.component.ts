import { Component, OnInit, ViewChild } from '@angular/core';
import { TreeNode, MenuItem, MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';

interface EditForm {
  // Common properties
  name: string;
  type?: string;
  idleDays?: string;
  assignedStaff?: string;
  initialStatus?: string;
  emailAdmin?: string;
  smsAdmin?: string;
  preAppInitStatus?: string;

  // Action properties
  actionType?: string;
  addressee?: string[];  // Changed to array for multi-select
  subject?: string;
  template?: string;
  content?: string;
  isReviewable?: boolean;
  previewOnly?: boolean;
  access?: string;
  documentFolder?: string;
  docType?: string;
  mailMergeDataSource?: string;

  // Decision properties
  decisionType?: string;
  commencedBy?: string;
  completedBy?: string;
  isCombineAllotment?: boolean;
  isSubdivision?: boolean;
  displayLocation?: string;
  costOfDevelopment?: string;
  OPBuildingPart?: string;

  // Transition properties
  input?: string;
  next?: string;
  selectAttachment?: boolean;

  // Template properties
  saveToRelatedDoc?: boolean;
  securePDF?: boolean;
  templates?: any[];
}

@Component({
  selector: 'app-workflow-visualizer',
  templateUrl: './workflow-visualizer.component.html',
  styleUrls: ['./workflow-visualizer.component.scss']
})
export class WorkflowVisualizerComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  
  searchText: string = '';
  applicationTypes: any[] = [
    { label: 'All', value: null },
    { label: 'Type1', value: 'type1' },
    { label: 'Type2', value: 'type2' }
  ];
  applicationType: any = null;
  loading: boolean = false;
  fileUploaded: boolean = false;
  editingKey: string | null = null;
  draftValue: string = '';
  showJsonEditor: boolean = false;
  jsonEditorContent: string = '';
  treeData: TreeNode[] = [];
  selectedNode: TreeNode | null = null;
  editDialogVisible: boolean = false;
  editForm: EditForm = {
    name: '',
    actionType: '',
    addressee: []
  };

  actionTypes: any[] = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Task', value: 'task' },
    { label: 'Decision', value: 'decision' },
    { label: 'Document', value: 'document' }
  ];

  nodeTypes: any[] = [
    { label: 'State', value: 'state' },
    { label: 'Transition', value: 'transition' },
    { label: 'Action', value: 'action' },
    { label: 'Template', value: 'template' },
    { label: 'Reminder', value: 'reminder' }
  ];

  addresseeOptions: any[] = [
    { label: 'Applicant', value: 'Applicant' },
    { label: 'Owner', value: 'Owner' },
    { label: 'Builder', value: 'Builder' },
    { label: 'Council', value: 'Council' },
    { label: 'AssignedStaff', value: 'AssignedStaff' },
    { label: 'SignOffStaff', value: 'SignOffStaff' }
  ];

  booleanOptions: any[] = [
    { label: 'True', value: true },
    { label: 'False', value: false }
  ];

  showAddNodeDialog: boolean = false;
  newNodeForm: EditForm = {
    name: '',
    type: ''
  };

  // Add workflow metadata properties
  workflowName: string = '';
  initialStatus: string = '';
  emailAdmin: string = '';
  smsAdmin: string = '';
  preAppInitStatus: string = '';

  // Add missing properties
  preApplicationInitialStatus: string = '';
  selectedApplicationType: string = '';

  constructor(private messageService: MessageService) {
    this.initializeSampleData();
  }

  ngOnInit() {}

  initializeSampleData() {
    this.treeData = [
      {
        data: { type: 'state', name: 'New' },
        children: [
          {
            data: { type: 'transition', name: 'Submit' },
            children: [
              {
                data: { 
                  type: 'action',
                  name: 'Send Email',
                  actionType: 'email',
                  addressee: ['applicant']
                }
              }
            ]
          }
        ]
      },
      {
        data: { type: 'state', name: 'Submitted' },
        children: []
      },
      {
        data: { type: 'state', name: 'Payment Requested' },
        children: []
      },
      {
        data: { type: 'state', name: 'Payment Received' },
        children: []
      }
    ];
  }

  getFilteredData(): TreeNode[] {
    if (!this.searchText && !this.applicationType) {
      return this.treeData;
    }

    return this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        JSON.stringify(node.data).toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = !this.applicationType || 
        node.data.type === this.applicationType;
      return matchesSearch && matchesType;
    });
  }

  startEdit(node: TreeNode) {
    this.selectedNode = node;
    this.editForm = {
      name: node.data.name,
      type: node.data.type,
      idleDays: node.data.idleDays,
      assignedStaff: node.data.assignedStaff,
      
      // Action properties
      actionType: node.data.actionType,
      addressee: Array.isArray(node.data.addressee) ? node.data.addressee : 
                (node.data.addressee ? node.data.addressee.split(',').map((a: string) => a.trim()) : []),
      subject: node.data.subject,
      template: node.data.template,
      content: node.data.content,
      isReviewable: node.data.isReviewable === 'true',
      previewOnly: node.data.previewOnly === 'true',
      access: node.data.access,
      documentFolder: node.data.documentFolder,
      docType: node.data.docType,
      mailMergeDataSource: node.data.mailMergeDataSource,

      // Decision properties
      decisionType: node.data.decisionType,
      commencedBy: node.data.commencedBy,
      completedBy: node.data.completedBy,
      isCombineAllotment: node.data.isCombineAllotment === 'true',
      isSubdivision: node.data.isSubdivision === 'true',
      displayLocation: node.data.displayLocation,
      costOfDevelopment: node.data.costOfDevelopment,
      OPBuildingPart: node.data.OPBuildingPart,

      // Transition properties
      input: node.data.input,
      next: node.data.next,
      selectAttachment: node.data.selectAttachment === 'true',

      // Template properties
      saveToRelatedDoc: node.data.saveToRelatedDoc === 'true',
      securePDF: node.data.securePDF === 'true'
    };
    this.editDialogVisible = true;
  }

  saveEdit() {
    if (this.selectedNode) {
      this.selectedNode.data = {
        ...this.selectedNode.data,
        name: this.editForm.name,
        type: this.editForm.type,
        idleDays: this.editForm.idleDays,
        assignedStaff: this.editForm.assignedStaff,
        
        // Action properties
        actionType: this.editForm.actionType,
        addressee: Array.isArray(this.editForm.addressee) ? this.editForm.addressee.join(',') : '',
        subject: this.editForm.subject,
        template: this.editForm.template,
        content: this.editForm.content,
        isReviewable: this.editForm.isReviewable?.toString(),
        previewOnly: this.editForm.previewOnly?.toString(),
        access: this.editForm.access,
        documentFolder: this.editForm.documentFolder,
        docType: this.editForm.docType,
        mailMergeDataSource: this.editForm.mailMergeDataSource,

        // Decision properties
        decisionType: this.editForm.decisionType,
        commencedBy: this.editForm.commencedBy,
        completedBy: this.editForm.completedBy,
        isCombineAllotment: this.editForm.isCombineAllotment?.toString(),
        isSubdivision: this.editForm.isSubdivision?.toString(),
        displayLocation: this.editForm.displayLocation,
        costOfDevelopment: this.editForm.costOfDevelopment,
        OPBuildingPart: this.editForm.OPBuildingPart,

        // Transition properties
        input: this.editForm.input,
        next: this.editForm.next,
        selectAttachment: this.editForm.selectAttachment?.toString(),

        // Template properties
        saveToRelatedDoc: this.editForm.saveToRelatedDoc?.toString(),
        securePDF: this.editForm.securePDF?.toString()
      };
    }
    this.editDialogVisible = false;
    this.selectedNode = null;
  }

  cancelEdit() {
    this.editDialogVisible = false;
    this.selectedNode = null;
  }

  getMenuItems(node: TreeNode): MenuItem[] {
    return [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.startEdit(node)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteNode(node)
      }
    ];
  }

  deleteNode(node: TreeNode) {
    const removeFromParent = (parent: TreeNode[], target: TreeNode) => {
      const index = parent.indexOf(target);
      if (index > -1) {
        parent.splice(index, 1);
      }
    };

    if (node.parent) {
      removeFromParent(node.parent.children || [], node);
    } else {
      removeFromParent(this.treeData, node);
    }
  }

  resetFilters() {
    this.searchText = '';
    this.applicationType = null;
    this.clearData();
  }

  loadWorkflow(jsonData: any) {
    try {
      console.log('Loading workflow data:', jsonData);
      
      if (jsonData.state) {
        // Store workflow metadata
        this.workflowName = jsonData._name || '';
        this.initialStatus = jsonData._initialStatus || '';
        this.emailAdmin = jsonData._EmailAdmin || '';
        this.smsAdmin = jsonData._SMSAdmin || '';
        this.preAppInitStatus = jsonData._PreAppInitStatus || '';

    const states = jsonData.state;
        this.treeData = states.map((state: any) => {
          return {
            data: {
              type: 'state',
              name: state._name || 'Unnamed State',
              idleDays: state._IdleDays || '',
              assignedStaff: state._assignedStaff || ''
            },
            children: this.mapTransitions(state.transition || [])
          };
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Loaded ${states.length} states successfully`
        });
      } else {
        throw new Error('Invalid workflow format: missing state property');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to parse workflow data'
      });
    }
  }

  private mapTransitions(transitions: any[]): TreeNode[] {
    if (!transitions) return [];
    
    return transitions.map((transition: any) => {
      const node: TreeNode = {
        data: {
          type: 'transition',
          name: transition._input || 'Unnamed Transition',
          input: transition._input || '',
          next: transition._next || '',
          selectAttachment: transition._selectAttachment === 'true'
        },
        children: []
      };

      let nodeChildren: TreeNode[] = [];

      // Add actions if present
      if (transition.action) {
        const actionNodes: TreeNode[] = [];
        
        transition.action.forEach((action: any) => {
          // Handle regular action
          const actionNode = this.createActionNode(action);
          if (!actionNode.children) actionNode.children = [];
          actionNodes.push(actionNode);

          // Handle letter templates if present
          if (action.letters?.template) {
            const templates = Array.isArray(action.letters.template) ? 
              action.letters.template : [action.letters.template];
            
            templates.forEach((template: any) => {
              actionNodes.push({
                data: {
                  type: 'template',
                  name: template._name || 'Unnamed Template',
                  saveToRelatedDoc: template._saveToRelatedDoc === 'true',
                  securePDF: template._securePDF === 'true'
                },
                children: []
              });
            });
          }
        });

        nodeChildren = actionNodes;
      }

      // Add reminders if present
      if (transition.reminder) {
        const reminders = Array.isArray(transition.reminder) ? 
          transition.reminder : [transition.reminder];
        
        const reminderNodes = reminders.map((reminder: any) => ({
          data: {
            type: 'reminder',
            name: reminder._content || 'Unnamed Reminder',
            content: reminder._content
          },
          children: []
        }));

        nodeChildren = nodeChildren.concat(reminderNodes);
      }

      node.children = nodeChildren;
      return node;
    });
  }

  private createActionNode(action: any): TreeNode {
    return {
      data: {
        type: 'action',
        name: action._template || action._content || 'Unnamed Action',
        actionType: action._type || '',
        addressee: action._addressee ? action._addressee.split(',') : [],
        subject: action._subject || '',
        template: action._template || '',
        content: action._content || '',
        isReviewable: action._isReviewable === 'true',
        previewOnly: action._previewOnly === 'true',
        access: action._access || '',
        documentFolder: action._documentFolder || '',
        docType: action._docType || '',
        mailMergeDataSource: action._mailMergeDataSource || '',
        decisionType: action._decisionType || '',
        commencedBy: action._commencedBy || '',
        completedBy: action._completedBy || '',
        isCombineAllotment: action._isCombineAllotment === 'true',
        isSubdivision: action._isSubdivision === 'true',
        displayLocation: action._displayLocation || '',
        costOfDevelopment: action._costOfDevelopment || '',
        OPBuildingPart: action._OPBuildingPart || ''
      }
    };
  }

  onFileUpload(event: any) {
    if (event.currentFiles && event.currentFiles.length > 0) {
      const file = event.currentFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          console.log('Parsed JSON:', json); // Debug log
          this.loadWorkflow(json);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File uploaded successfully'
          });
        } catch (error) {
          console.error('Error parsing JSON:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid JSON file'
          });
        }
      };

      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to read file'
        });
      };

      reader.readAsText(file);
    }
  }

  onFileClear() {
    this.clearData();
  }

  downloadJson() {
    try {
      // Convert the tree data back to the original format
      const downloadData = {
        _name: "BuildingPermit",
        state: this.treeData.map(stateNode => {
          const state: any = {
            _name: stateNode.data.name,
            _IdleDays: stateNode.data.idleDays || ""
          };

          if (stateNode.children && stateNode.children.length > 0) {
            state.transition = stateNode.children.map(transNode => {
              const trans: any = {
                _input: transNode.data.name,
                _next: transNode.data.next,
                _selectAttachment: transNode.data.selectAttachment
              };

              if (transNode.children && transNode.children.length > 0) {
                trans.action = [];
                trans.reminder = [];

                transNode.children.forEach(child => {
                  if (child.data.type === 'action') {
                    const action: any = {
                      _type: child.data.actionType,
                      _addressee: child.data.addressee,
                      _template: child.data.name,
                      _subject: child.data.subject,
                      _isReviewable: child.data.isReviewable,
                      _documentFolder: child.data.documentFolder,
                      _docType: child.data.docType
                    };
                    trans.action.push(action);
                  } else if (child.data.type === 'template') {
                    if (!trans.action[0]) trans.action[0] = {};
                    if (!trans.action[0].letters) trans.action[0].letters = { template: [] };
                    trans.action[0].letters.template.push({
                      _name: child.data.name,
                      _saveToRelatedDoc: child.data.saveToRelatedDoc,
                      _securePDF: child.data.securePDF
                    });
                  } else if (child.data.type === 'reminder') {
                    trans.reminder.push({
                      _content: child.data.name
                    });
                  }
                });
              }
              return trans;
            });
          }
          return state;
        })
      };

      const jsonData = JSON.stringify(downloadData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workflow.json';
      document.body.appendChild(link);
    link.click();
      document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Workflow downloaded successfully'
      });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download workflow'
      });
    }
  }

  openJsonEditor() {
    this.jsonEditorContent = JSON.stringify(this.treeData, null, 2);
    this.showJsonEditor = true;
  }

  closeJsonEditor() {
    this.showJsonEditor = false;
    this.jsonEditorContent = '';
  }

  applyJsonChanges() {
    try {
      const newData = JSON.parse(this.jsonEditorContent);
      this.loadWorkflow(newData);
      this.showJsonEditor = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'JSON changes applied successfully'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid JSON format'
      });
    }
  }

  clearData() {
    this.treeData = [];
    this.fileUploaded = false;
    // Reset the file upload component
    const fileUpload = document.querySelector('p-fileUpload') as any;
    if (fileUpload?.clear) {
      fileUpload.clear();
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Reset',
      detail: 'All data has been cleared'
    });
  }

  addNode() {
    const newNode: TreeNode = {
      data: {
        type: this.newNodeForm.type,
        name: this.newNodeForm.name
      },
      children: []
    };

    if (this.selectedNode) {
      // If a node is selected, add as child if it's a state or transition
      if (this.selectedNode.data.type === 'state') {
        if (!this.selectedNode.children) {
          this.selectedNode.children = [];
        }
        this.selectedNode.children.push(newNode);
      } else if (this.selectedNode.data.type === 'transition') {
        if (!this.selectedNode.children) {
          this.selectedNode.children = [];
        }
        this.selectedNode.children.push(newNode);
      }
    } else {
      // If no node is selected and it's a state, add to root level
      if (this.newNodeForm.type === 'state') {
        this.treeData.push(newNode);
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please select a parent node first'
        });
        return;
      }
    }

    this.showAddNodeDialog = false;
    this.newNodeForm = { name: '', type: '' };
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Node added successfully'
    });
  }

  openAddNodeDialog() {
    this.showAddNodeDialog = true;
  }

  cancelAddNode() {
    this.showAddNodeDialog = false;
    this.newNodeForm = { name: '', type: '' };
  }

  // Add missing method
  filterNodes() {
    // If there's no search text or selected type, return all nodes
    if (!this.searchText && !this.selectedApplicationType) {
      return this.treeData;
    }

    // Filter nodes based on search text and selected type
    const filteredData = this.treeData.filter(node => {
      const matchesSearch = !this.searchText || 
        node.data.name.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesType = !this.selectedApplicationType || 
        node.data.type === this.selectedApplicationType;

      return matchesSearch && matchesType;
    });

    return filteredData;
  }
}
